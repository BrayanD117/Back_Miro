const mongoose = require('mongoose');
const PublishedTemplate = require('./models/publishedTemplates'); // Ajusta la ruta si es diferente

// 🔧 Configura aquí la categoría y la secuencia deseadas (pueden ser null si quieres quitar)
const categoryId = null; // o '64fd1234abcdef1234567890' si tienes una categoría válida
const sequence = null;   // o un número, por ejemplo: 1

async function updatePublishedTemplates() {
  try {
    console.log('📦 Conectando a MongoDB...');
    await mongoose.connect('mongodb://localhost:27020/miro');

    console.log('🔍 Valores usados:');
    console.log('   - Category:', categoryId);
    console.log('   - Sequence:', sequence);

    const updateData = {
      category: categoryId ? new mongoose.Types.ObjectId(categoryId) : null,
      sequence: sequence !== null ? sequence : null
    };

    const result = await PublishedTemplate.updateMany({}, { $set: updateData });

    console.log(`✅ Actualización completada: ${result.modifiedCount} documentos modificados.`);
  } catch (error) {
    console.error('❌ Error actualizando publishedTemplates:', error);
  } finally {
    mongoose.disconnect();
  }
}

updatePublishedTemplates();
