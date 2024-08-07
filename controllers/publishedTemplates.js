const PublishedTemplate = require('../models/publishedTemplates.js');
const Template = require('../models/templates.js')
const Period = require('../models/periods.js')
const Dimension = require('../models/dimensions.js')
const Dependency = require('../models/dependencies.js')
const User = require('../models/users.js')
const Validator = require('./validators.js');
const validators = require('../models/validators.js');

const publTempController = {};

datetime_now = () => {
  const now = new Date();

  const offset = -5; // GMT-5
  return new Date(now.getTime() + offset * 60 * 60 * 1000);
}

publTempController.publishTemplate = async (req, res) => {
  console.log(req.body)
  template_id = req.body.template_id
  email = req.body.user_email

  try {
      const template = await Template.findById(template_id)
      if(!template) {
          return res.status(404).json({status: 'Template not found'})
      }

      const date_now = datetime_now()

      // Name => Recibe el nombre de la plantilla (modificable) + period_name
      const newPublTemp = new PublishedTemplate({
          name: req.body.name || template.name,
          published_by: user,
          template: template,
          period: req.body.period_id,
          producers_dep_code: req.body.producers_dep_code,
          published_date: date_now
      })

      await newPublTemp.save()

      return res.status(201).json({status: 'Template published successfully'})
  } catch (error) {
      return res.status(500).json({status: error.message})
  }
}

publTempController.getPublishedTemplatesDimension = async (req, res) => {
  const email = req.query.email;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'User not found' });
    }

    const activeRole = user.activeRole;

    let query = {
      name: { $regex: search, $options: 'i' }
    };

    
    if (activeRole !== 'Administrador') {
      const dimensionIds = dimensions.map(dim => dim._id);
      if (dimensionIds.length > 0) {
        query['template.dimension'] = { $in: dimensionIds };
      } else {
        return res.status(403).json({ status: 'Access denied' });
      }
    }

    const published_templates = await PublishedTemplate.find(query)
      .skip(skip)
      .limit(limit)
      .populate('period')
      .populate({
        path: 'template',
        populate: {
          path: 'dimension',
          model: 'dimensions'
        }
      });

    const total = await PublishedTemplate.countDocuments(query);
    
    published_templates.forEach(template => {
      delete template.loaded_data;
    });
    
    res.status(200).json({
      templates: published_templates,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


publTempController.getAssignedTemplatesToProductor = async (req, res) => {
  const email = req.query.email;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.roles.includes('Productor')) {
      return res.status(404).json({ status: 'User not found' });
    }

    const query = {
      producers_dep_code: user.dep_code,
      name: { $regex: search, $options: 'i' }
    };

    const templates = await PublishedTemplate.find(query)
      .skip(skip)
      .limit(limit)
      .populate('period')
      .populate({
        path: 'template',
        populate: {
          path: 'dimension',
          model: 'dimensions'
        }
      });

    const total = await PublishedTemplate.countDocuments(query);

    const updatedTemplatesPromises = templates.map(async t => {
      let uploaded = false;
    
      // Filtrar loaded_data según dep_code
      const filteredLoadedData = t.loaded_data.filter(ld => {
        if (ld.send_by.dep_code === user.dep_code) {
          uploaded = true;
        }
        return ld.dependency === user.dep_code;
      });

      // Transformar filteredLoadedData en un formato similar al método getFilledDataMergedForResponsible
      const transformedLoadedData = filteredLoadedData.map(ld => {
        const filledData = ld.filled_data.reduce((acc, item) => {
          item.values.forEach((value, index) => {
            if (!acc[index]) {
              acc[index] = { Dependencia: ld.dependency };
            }
            acc[index][item.field_name] = value.$numberInt || value;
          });
          return acc;
        }, []);
    
        return filledData;
      }).flat();

      // Obtener validadores utilizando giveValidatorToExcel
      const validatorPromises = t.template.fields.map(field => {
        return Validator.giveValidatorToExcel(field.validate_with);
      });

      const validators = await Promise.all(validatorPromises);
    
      return {
        ...t.toObject(),
        loaded_data: transformedLoadedData,
        uploaded,
        validators
      };
    });

    const updatedTemplates = await Promise.all(updatedTemplatesPromises);

    res.status(200).json({
      templates: updatedTemplates,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

publTempController.feedOptionsToPublishTemplate = async (req, res) => {
  const email = req.query.email;

  try {
      const dimension = await Dimension.findOne({ responsible: email });
      if (!dimension) {
          return res.status(404).json({ status: 'Dimension not found' });
      }
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ status: 'User not found' });
      }
      if (!dimension.producers.includes(user.dep_code) && !user.roles.includes('Administrador' || 'Responsable')) {
          return res.status(403).json({ status: 'User is not responsible of this dimension' });
      }

      // Get active periods
      const periods = await Period.find({ is_active: true });

      // Get dependencie producers
      const producers = await Dependency.find({ dep_code: { $in: dimension.producers } });

      res.status(200).json({ periods, producers });

  } catch (error) {
      console.log(error.message);
      res.status(500).json({ status: 'Internal server error', details: error.message });
  }
}

publTempController.loadProducerData = async (req, res) => {
  const { email, pubTem_id, data, edit } = req.body;
  // Obtener el parámetro edit de la query

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'User not found' });
    }

    const pubTem = await PublishedTemplate.findById(pubTem_id);
    if (!pubTem) {
      return res.status(404).json({ status: 'Published template not found' });
    }

    if (!pubTem.producers_dep_code.includes(user.dep_code)) {
      return res.status(403).json({ status: 'User is not assigned to this published template' });
    }

    // Asigna el published_date si no existe
    if (!pubTem.published_date) {
      pubTem.published_date = datetime_now();
    }

    const fieldValuesMap = {};

    data.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (!fieldValuesMap[key]) {
          fieldValuesMap[key] = [];
        }
        fieldValuesMap[key].push(value);
      });
    });

    const result = Object.entries(fieldValuesMap).map(([key, values]) => ({
      field_name: key,
      values: values
    }));

    const validations = result.map(async field => {
      const templateField = pubTem.template.fields.find(f => f.name === field.field_name);
      if (!templateField) {
        throw new Error(`Field ${field.field_name} not found in template`);
      }

      templateField.values = field.values;

      const validationResult = await Validator.validateColumn(templateField);
      return validationResult;
    });

    const validationResults = await Promise.all(validations);

    const validationErrors = validationResults.filter(v => v.status === false);

    if (validationErrors.length > 0) {
      return res.status(400).json({ status: 'Validation error', details: validationErrors });
    }

    const producersData = {
      dependency: user.dep_code,
      send_by: user,
      filled_data: result,
      loaded_date: datetime_now()  // Agregar la fecha de carga
    };

    if (edit === true) {
      const existingDataIndex = pubTem.loaded_data.findIndex(
        data => data.dependency === user.dep_code
      );

      if (existingDataIndex > -1) {
        pubTem.loaded_data[existingDataIndex] = producersData;
      } else {
        pubTem.loaded_data.push(producersData);
      }
    } else {
      // Solo agregar datos nuevos si edit no es true
      pubTem.loaded_data.push(producersData);
    }

    await pubTem.save();

    return res.status(200).json({ status: 'Data loaded successfully' });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 'Internal server error', details: error.message });
  }
};

publTempController.deleteLoadedDataDependency = async (req, res) => {
  const { pubTem_id, email } = req.query

  try {
    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ status: 'User not found' }) }

    const pubTem = await PublishedTemplate.findById(pubTem_id);
    if (!pubTem) { return res.status(404).json({ status: 'Published template not found' }) }

    if (!pubTem.producers_dep_code.includes(user.dep_code)) {
      return res.status(403).json({ status: 'User is not assigned to this published template' })
    }

    const index = pubTem.loaded_data.findIndex(data => data.dependency === user.dep_code)
    if (index === -1) { return res.status(404).json({ status: 'Data not found' }) }
  
    pubTem.loaded_data.splice(index, 1);
    await pubTem.save();
    return res.status(200).json({ status: 'Data deleted successfully' })
  } catch (error) {
    return res.status(500).json({ status: 'Internal server error', details: error.message })
  }
};


publTempController.getFilledDataMergedForDimension = async (req, res) => {
  const { pubTem_id, email } = req.query;

  user = await User.findOne({ email })

  if(!user || !user.roles.includes('Responsable') || !user.roles.includes('Administrador')) {
    return res.status(404).json({status: 'User not available'})
  }

  if (!pubTem_id) {
    return res.status(400).json({ status: 'Missing pubTem_id' });
  }

  try {
    const template = await PublishedTemplate.findById(pubTem_id);

    if (!template) {
      return res.status(404).json({ status: 'Published template not found' });
    }

    const data = template.loaded_data.map(data => {
      const filledData = data.filled_data.reduce((acc, item) => {
        item.values.forEach((value, index) => {
          if (!acc[index]) {
            acc[index] = {Dependencia: data.dependency};
          }
          acc[index][item.field_name] = value.$numberInt || value;
        });
        return acc;
      }, []);
    
      return filledData;
    }).flat();

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los datos de la plantilla' });
  }
}


publTempController.getUploadedTemplatesByProducer = async (req, res) => {
  const email = req.query.email;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.roles.includes('Productor')) {
      return res.status(404).json({ status: 'User not found' });
    }

    const query = {
      'loaded_data.send_by.email': email,
      name: { $regex: search, $options: 'i' }
    };

    const templates = await PublishedTemplate.find(query)
      .skip(skip)
      .limit(limit)
      .populate('period')
      .populate({
        path: 'template',
        populate: {
          path: 'dimension',
          model: 'dimensions'
        }
      });

    const total = await PublishedTemplate.countDocuments(query);

    res.status(200).json({
      templates,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching uploaded templates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// TODO Editar publishedTemplate (Productores)


module.exports = publTempController;
