const axios = require('axios');
const Student = require('../models/students');
const { default: mongoose } = require('mongoose');

const studentsController = {};

studentsController.syncStudents = async (req, res) => {
  try {
    const students = await axios.get(process.env.STUDENTS_ENDPOINT);
    console.log(students.data[0]);
    await Student.syncUsers(students.data);
    res.status(200).send('Sincronización exitosa');
  } catch (error) {
    res.status(500).send(error);
  }
}

studentsController.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).send(error);
  }
}

studentsController.getStudent = async (req, res) => {
  try {
      const student = await Student.findById(req.params.id);
      res.json(student);
  } catch (error) {
      res.status(500).send(error);
  }
}

module.exports = studentsController;