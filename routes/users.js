const express = require('express');
const router = express.Router();
const controller = require('../controllers/users.js');

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Endpoints relacionados con usuarios
 */

/**
 * @swagger
 * /users/all:
 *   get:
 *     summary: Retrieve a list of all users
 *     description: Obtiene una lista de todos los usuarios en la base de datos.
 *     tags: 
 *       - Users
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/all", controller.getUsers);

/**
 * @swagger
 * /users/allPagination:
 *   get:
 *     summary: Retrieve paginated list of users
 *     description: Obtiene una lista paginada de usuarios con opciones de búsqueda.
 *     tags: 
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página solicitada (por defecto 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de usuarios por página (por defecto 20)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtro de búsqueda para usuarios
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                   description: Número total de usuarios
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 */
router.get("/allPagination", controller.getUsersPagination);

/**
 * @swagger
 * /users/roles:
 *   get:
 *     summary: Retrieve roles of a specific user
 *     description: Obtiene los roles y el rol activo de un usuario específico por su correo electrónico.
 *     tags: 
 *       - Users
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del usuario
 *     responses:
 *       200:
 *         description: Roles obtenidos con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                 activeRole:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado.
 */
router.get("/roles", controller.getUserRoles);

/**
 * @swagger
 * /users/responsibles:
 *   get:
 *     summary: Retrieve all responsible users
 *     description: Obtiene todos los usuarios que tienen el rol de "Responsable".
 *     tags: 
 *       - Users
 *     responses:
 *       200:
 *         description: Lista de responsables obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/responsibles", controller.getResponsibles);

/**
 * @swagger
 * /users/producers:
 *   get:
 *     summary: Retrieve all producer users
 *     description: Obtiene todos los usuarios que tienen el rol de "Productor".
 *     tags: 
 *       - Users
 *     responses:
 *       200:
 *         description: Lista de productores obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/producers", controller.getProducers);

/**
 * @swagger
 * /users/updateRole:
 *   put:
 *     summary: Update user roles
 *     description: Actualiza los roles de un usuario específico.
 *     tags: 
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Nuevos roles del usuario
 *     responses:
 *       200:
 *         description: Roles actualizados con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       404:
 *         description: Usuario no encontrado.
 */
router.put("/updateRole", controller.updateUserRoles);

/**
 * @swagger
 * /users/updateActiveRole:
 *   put:
 *     summary: Update user's active role
 *     description: Actualiza el rol activo de un usuario específico.
 *     tags: 
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               activeRole:
 *                 type: string
 *                 description: Nuevo rol activo
 *     responses:
 *       200:
 *         description: Rol activo actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       404:
 *         description: Usuario no encontrado.
 */
router.put("/updateActiveRole", controller.updateUserActiveRole);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a specific user by email
 *     description: Obtiene la información de un usuario específico por su correo electrónico.
 *     tags: 
 *       - Users
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Usuario no encontrado o inactivo.
 */
router.get("/", controller.getUser);

/**
 * @swagger
 * /users/updateAll:
 *   post:
 *     summary: Synchronize users from an external service
 *     description: Sincroniza todos los usuarios desde un servicio externo y actualiza la base de datos interna.
 *     tags: 
 *       - Users
 *     responses:
 *       200:
 *         description: Usuarios sincronizados con éxito.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/updateAll", controller.loadUsers);

/**
 * @swagger
 * /users/addExternalUser:
 *   post:
 *     summary: Add an external user
 *     description: Agrega un usuario externo a la base de datos.
 *     tags: 
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dep_code:
 *                 type: string
 *               email:
 *                 type: string
 *               full_name:
 *                 type: string
 *               identification:
 *                 type: number
 *               position:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario externo creado con éxito.
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/addExternalUser", controller.addExternalUser);

/**
 * @swagger
 * /users/updateStatus:
 *   put:
 *     summary: Update user status
 *     description: Actualiza el estado de un usuario (activo/inactivo).
 *     tags: 
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               isActive:
 *                 type: boolean
 *                 description: Estado del usuario
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       404:
 *         description: Usuario no encontrado.
 */
router.put("/updateStatus", controller.updateUserStatus);

/**
 * @swagger
 * /users/{dep_code}/users:
 *   get:
 *     summary: Retrieve users by dependency code
 *     description: Obtiene todos los usuarios asociados a un código de dependencia específico.
 *     tags: 
 *       - Users
 *     parameters:
 *       - in: path
 *         name: dep_code
 *         schema:
 *           type: string
 *         required: true
 *         description: Código de la dependencia
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/:dep_code/users", controller.getUsersByDependency);

module.exports = router;
