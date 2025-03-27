const PublishedTemplate = require('../models/publishedTemplates.js');
const Template = require('../models/templates.js')
const Period = require('../models/periods.js')
const Dimension = require('../models/dimensions.js')
const Dependency = require('../models/dependencies.js')
const User = require('../models/users.js')
const Validator = require('./validators.js');
const ValidatorModel = require('../models/validators');
const Log = require('../models/logs');
const UserService = require('../services/users.js');
const Category = require('../models/categories.js');  // Asegúrate de tener el modelo Category

const publTempController = {};

datetime_now = () => {
  const now = new Date();

  const offset = -5; // GMT-5
  return new Date(now.getTime() + offset * 60 * 60 * 1000);
}

publTempController.publishTemplate = async (req, res) => {
  const template_id = req.body.template_id
  const email = req.body.user_email

  try {
    const template = await Template.findById(template_id)
    if (!template) {
      return res.status(404).json({ status: 'Template not found' })
    }

    const user = await UserService.findUserByEmailAndRole(email, 'Administrador')

    // Recuperar la categoría y secuencia de la plantilla
    const category = template.category;  // Esto asume que la plantilla tiene un campo de referencia a la categoría
    const sequence = template.sequence;  // Esto asume que la plantilla tiene un campo 'sequence'

    // Name => Recibe el nombre de la plantilla (modificable) + period_name
    const newPublTemp = new PublishedTemplate({
      name: req.body.name || template.name,
      published_by: user,
      template: template,
      period: req.body.period_id,
      deadline: req.body.deadline,
      published_date: datetime_now(),
      category: category,  // Asignar la categoría de la plantilla
      sequence: sequence   // Asignar la secuencia de la plantilla
    })

    await newPublTemp.save()

    return res.status(201).json({ status: 'Template published successfully' })
  } catch (error) {
    return res.status(500).json({ status: error.message })
  }
}


publTempController.getPublishedTemplatesDimension = async (req, res) => {
  const email = req.query.email;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const periodId = req.query.periodId || null;
  const skip = (page - 1) * limit;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'User not found' });
    }

    const dimensions = await Dimension.find().populate({
      path: 'responsible',
      match: { responsible: email }
    }).then(dimensions => dimensions.filter(dim => dim.responsible));

    const activeRole = user.activeRole;

    let query = {
      name: { $regex: search, $options: 'i' },
      ...(periodId && { period: periodId }),
    };
    
    if (activeRole !== 'Administrador') {
      const dimensionIds = dimensions.map(dim => dim._id);
      if (dimensionIds.length > 0) {
        query['template.dimensions'] = { $in: dimensionIds };
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
        populate: 
        [
          { path: 'dimensions', model: 'dimensions' },
        ]
      });


    const total = await PublishedTemplate.countDocuments(query);
    
    const updated_templates = await Promise.all(published_templates.map(async template => {
      const validators = await Promise.all(
        template.template.fields.map(async (field) => {
          return Validator.giveValidatorToExcel(field.validate_with);
        })
      );

      template = template.toObject();
      validatorsFiltered = validators.filter(v => v !== undefined)
      template.validators = validatorsFiltered // Añadir validators al objeto

      const dependencies = await Dependency.find(
        { dep_code: { $in: template.producers_dep_code } },
        'name -_id'
      );
      template.producers_dep_code = dependencies.map(dep => dep.name);
      
      template.loaded_data = await Promise.all(template.loaded_data.map(async data => {
        const loadedDependency = await Dependency.findOne(
          { dep_code: data.dependency },
          'name -_id'
        );
        data.dependency = loadedDependency ? loadedDependency.name : data.dependency;
        return data;
      }));
      
      return template;
    }));
    
    res.status(200).json({
      templates: updated_templates, finalTemplates,
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
    if (!user || !user.activeRole === 'Productor') {
      return res.status(404).json({ status: 'User not found' });
    }

    const query = {
      name: { $regex: search, $options: 'i' }
    };

    let templates = await PublishedTemplate.find(query)
      .skip(skip)
      .limit(limit)
      .populate('period')
      .populate({
        path: 'template',
        populate: {
          path: 'dimension',
          model: 'dimensions'
        }
      })
      .populate({
        path: 'template.producers',
        model: 'dependencies',
        match: { members: user.email } 
      })
      

    console.log(templates)

    templates = templates.filter(t => t.template.producers.length > 0);

    const total = await PublishedTemplate.countDocuments(query);

    const updatedTemplatesPromises = templates.map(async t => {
      
      const validators = await Promise.all(
        t.template.fields.map(async (field) => {
          return Validator.giveValidatorToExcel(field.validate_with);
        })
      );

      t = t.toObject();
      validatorsFiltered = validators.filter(v => v !== undefined)
      t.validators = validatorsFiltered // Añadir validators al objeto
  
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



      return {
        ...t,
        loaded_data: transformedLoadedData,
        uploaded
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
      await UserService.findUserByEmailAndRole(email, 'Administrador');

      // Get active periods
      const periods = await Period.find({
        is_active: true,
        producer_end_date: { $gte: datetime_now() }
      })
      .sort({ updatedAt: -1 })

      // Get dependencie producers
      const producers = await Dependency.find();

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

    const pubTem = await PublishedTemplate
      .findById(pubTem_id)
      .populate('period')
      .populate({
        path: 'template',
        populate: {
          path: 'producers',
          model: 'dependencies'
        }
      })
    console.log(pubTem.template.producers)
    if (!pubTem) {
      return res.status(404).json({ status: 'Published template not found' });
    }

    const now = new Date(datetime_now().toDateString());
    const endDate = new Date(pubTem.deadline).toDateString();
    if( endDate < now ) {
      return res.status(403).json({ status: 'The period is closed' });
    }
    
    const producer = pubTem.template?.producers.find(p => p.members.includes(user.email));
    console.log(pubTem.template?.producers)
    if (!producer) {
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
    console.log("Validation errors", validationErrors);
    if (validationErrors.length > 0) {
      await Log.create({
        user: user,
        published_template: pubTem._id,
        date: datetime_now(),
        errors: validationErrors.map(err => ({
          column: err.column,
          description: err.errors
        }))
      })
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

    return res.status(200).json({ 
      status: 'Data loaded successfully', 
      recordsLoaded: data.length
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 'Internal server error', details: error.message });
  }
};

publTempController.submitEmptyData = async (req, res) => {
  const { pubTemId, email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const pubTem = await PublishedTemplate
      .findById(pubTemId)
      .populate('period')
      .populate({
        path: 'template',
        populate: {
          path: 'producers',
          model: 'dependencies'
        }
      })

    if (!pubTem) {
      throw new Error('Published template not found');
    }
        
    const producersData = {
      dependency: user.dep_code,
      send_by: user,
      loaded_date: datetime_now(),  // Agregar la fecha de carga
      filled_data: []
    };

    const existingDataIndex = pubTem.loaded_data.findIndex(
      data => data.dependency === user.dep_code
    );

    if (existingDataIndex > -1) {
      throw new Error('Data already exists');
    } else {
      pubTem.loaded_data.push(producersData);
    }

    await pubTem.save();
    return res.status(200).json({ status: 'Data loaded successfully' });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ status: 'Internal server error', details: error.message });
  }
}

publTempController.deleteLoadedDataDependency = async (req, res) => {
  const { pubTem_id, email } = req.query

  try {
    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ status: 'User not found' }) }

    const pubTem = await PublishedTemplate.findById(pubTem_id)
      .populate({
        path: 'template.producers',
        model: 'dependencies',
        match: { members: user.email }
      })

    if (!pubTem) { return res.status(404).json({ status: 'Published template not found' }) }

    if (!pubTem.template.producers.length === 0) {
      return res.status(403).json({ status: 'User is not assigned to this published template' })
    }

    const index = pubTem.loaded_data.findIndex(data => data.dependency === user.dep_code)
    if (index === -1) { return res.status(404).json({ status: 'Data not found' }) }
  
    pubTem.loaded_data.splice(index, 1);
    await pubTem.save();
    return res.status(200).json({ status: 'Data deleted successfully' })
  } catch (error) {
    console.log(error.message)
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

    const dependencies = await Dependency.find({ dep_code: { $in: template.loaded_data.map(data => data.dependency) } });

    const depCodeToNameMap = dependencies.reduce((acc, dep) => {
      acc[dep.dep_code] = dep.name;
      return acc;
    }, {});

    const data = template.loaded_data.map(data => {
      const filledData = data.filled_data.reduce((acc, item) => {
        item.values.forEach((value, index) => {
          if (!acc[index]) {
            acc[index] = { Dependencia: depCodeToNameMap[data.dependency] || data.dependency };
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
  const periodId = req.query.periodId;
  const skip = (page - 1) * limit;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.roles.includes('Productor')) {
      return res.status(404).json({ status: 'User not found' });
    }

    const query = {
      'loaded_data.send_by.dep_code': user.dep_code,
      name: { $regex: search, $options: 'i' }
    };

    if (periodId) {
      query.period = periodId;
    }

    const templates = await PublishedTemplate.find(query)
      .skip(skip)
      .limit(limit)
      .populate('period')
      .populate({
        path: 'template',
        populate: {
          path: 'dimensions',
          model: 'dimensions'
        }
      });

      const templatesWithValidators = await Promise.all(
        templates.map(async (template) => {
          const validators = await Promise.all(
            template.template.fields.map(async (field) => {
              return Validator.giveValidatorToExcel(field.validate_with);
            })
          );
  
          template = template.toObject();
          validatorsFiltered = validators.filter(v => v !== undefined)
          template.validators = validatorsFiltered // Añadir validators al objeto
  
          return template;
        })
      );

    const total = await PublishedTemplate.countDocuments(query);

    res.status(200).json({
      "templates": templatesWithValidators,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching uploaded templates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

publTempController.getAvailableTemplatesToProductor = async (req, res) => {
  const { email, periodId, page = 1, limit = 10, search = '' } = req.query;
  const skip = (page - 1) * limit;

  try {
    // Find user productor
    const user = await UserService.findUserByEmailAndRole(email, 'Productor');
    if (!user) {
      return res.status(404).json({ error: 'User not found or not a producer' });
    }

    const dependency = await Dependency.findOne({ dep_code: user.dep_code });
    if (!dependency) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    // Build query for PublishedTemplates
    const query = { 
      name: { $regex: search, $options: 'i' },
      'template.producers': dependency._id,
    };

    if (periodId) query.period = periodId;

    // Count total documents without pagination
    const total = await PublishedTemplate.countDocuments(query);

    // Fetch templates with initial population
    const templates = await PublishedTemplate.find(query)
      .skip(skip)
      .limit(limit)
      .populate('period')
      .populate({
        path: 'template',
        populate: [
          { path: 'dimensions', model: 'dimensions' },
          { path: 'producers', model: 'dependencies' }
        ]
      }).lean();

    // Manually fetch categories
    const templatesWithCategories = await Promise.all(templates.map(async (template) => {
      // Find the category directly from the original template
      const originalTemplate = await Template.findById(template.template._id)
        .populate({
          path: 'category',
          model: 'categories',
          select: 'name templates' // Select specific fields if needed
        }).lean();
      
        // Find the sequence for this template within the category
        let sequence = null;
        if (originalTemplate.category) {
          const sequenceObj = originalTemplate.category.templates.find(
            t => t.templateId.toString() === template.template._id.toString()
          );
          sequence = sequenceObj ? sequenceObj.sequence : null;
        }
  
        return {
          ...template,
          template: {
            ...template.template,
            category: {
              ...originalTemplate.category,
              templateSequence: sequence
            }
          }
        };
      }));

      // Custom sorting logic
      const sortedTemplates = templatesWithCategories.sort((a, b) => {
        // First, prioritize templates with categories
        const hasCategA = !!a.template.category.name && a.template.category.name !== 'Sin categoría';
        const hasCategB = !!b.template.category.name && b.template.category.name !== 'Sin categoría';
        
        // If one template has a category and the other doesn't, prioritize the one with category
        if (hasCategA !== hasCategB) {
          return hasCategB - hasCategA;
        }
        
        // If both have categories, sort by category name
        const categoryComparison = (a.template.category.name || '').localeCompare(
          b.template.category.name || ''
        );
        
        // If categories are the same, sort by sequence
        if (categoryComparison === 0) {
          // Handle cases where sequence might be null
          const seqA = a.template.category.templateSequence ?? Infinity;
          const seqB = b.template.category.templateSequence ?? Infinity;
          return seqA - seqB;
        }
        
        return categoryComparison;
      });

    // Paginate the sorted templates
    const paginatedTemplates = sortedTemplates.slice(skip, skip + limit);

    // Filter templates without loaded data
    const filteredTemplates = paginatedTemplates.filter(
      (template) => !template.loaded_data?.some((data) => data.dependency === String(dependency.dep_code))
    );

    // Get validators for filtered templates
    const templatesWithValidators = await Promise.all(
      filteredTemplates.map(async (template) => {
        const validators = (
          await Promise.all(
            template.template.fields.map(async (field) => 
              Validator.giveValidatorToExcel(field.validate_with)
            )
          )
        ).filter(Boolean);

        return { ...template, validators };
      })
    );

    res.status(200).json({
      templates: templatesWithValidators,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching available templates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


publTempController.getTemplateById = async (req, res) => {
  const templateId = req.params.id;

  try {
    const publishedTemplate = await PublishedTemplate.findById(templateId)
      .populate({
        path: 'template',
        populate: [
          { path: 'dimensions', model: 'dimensions' },
          { path: 'producers', model: 'dependencies' },
        ]
      })


    if (!publishedTemplate) {
      return res.status(404).json({ status: 'Template not found' });
    }

    const fieldsWithValidatorIds = await Promise.all(publishedTemplate.template.fields.map(async (field) => {
      if (field.validate_with) {
        try {
          // Extraer el nombre del template y el nombre de la columna desde field.validate_with
          const [templateName, columnName] = field.validate_with.split(' - ');

          // Buscar en la base de datos por el templateName y luego encontrar la columna correspondiente
          const validator = await ValidatorModel.findOne({ name: templateName });
          
          if (validator) {
            // Encontrar la columna que es validadora
            const column = validator.columns.find(col => col.name === columnName && col.is_validator);
            
            if (column) {
              field.validate_with = {
                id: validator._id.toString(),
                name: `${validator.name} - ${column.name}`,
              };
            } else {
              console.error(`Validator column not found for: ${columnName}`);
            }
          } else {
            console.error(`Validator not found for template: ${templateName}`);
          }
        } catch (err) {
          console.error(`Error during ValidatorModel.findOne: ${err.message}`);
        }
      }
      return field;
    }));

    const response = {
      name: publishedTemplate.name,
      template: {
        ...publishedTemplate.template._doc,
        fields: fieldsWithValidatorIds,
      },
      publishedTemplate: publishedTemplate
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching template by ID:', error);
    res.status(500).json({ status: 'Internal Server Error', error: error.message });
  }
};

publTempController.getUploadedTemplateDataByProducer = async (req, res) => {
  const { id_template } = req.params;
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.roles.includes('Productor')) {
      return res.status(404).json({ status: 'User not found' });
    }

    const template = await PublishedTemplate.findOne({
      _id: id_template,
      'loaded_data.dependency': user.dep_code,
    });

    if (!template) {
      return res.status(404).json({ status: 'Template not found' });
    }

    const producerData = template.loaded_data.find(
      (data) => data.send_by.email === email
    );

    res.status(200).json({ data: producerData.filled_data });
  } catch (error) {
    console.error('Error fetching template data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//Only deletes if there's no loaded data
publTempController.deletePublishedTemplate = async (req, res) => {
  const { id, email } = req.query;

  try {
    await UserService.findUserByEmailAndRole(email, 'Administrador');

    const template = await PublishedTemplate.findById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    if (template.loaded_data?.length > 0) {
      throw new Error('Template has loaded data');
    }

    await PublishedTemplate.findByIdAndDelete(id);
    res.status(200).json({ status: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// TODO Editar publishedTemplate (Productores)


module.exports = publTempController;
