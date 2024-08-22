/**
 * @swagger
 * tags:
 *   - name: Validators
 *     description: Endpoints relacionados con los validadores
 */

/**
 * @swagger
 * /validators/create:
 *   post:
 *     summary: Create a new validator
 *     description: Crea un nuevo validador con sus respectivas columnas.
 *     tags:
 *       - Validators
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del validador
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Nombre de la columna
 *                     is_validator:
 *                       type: boolean
 *                       description: Indica si esta columna es utilizada como validador
 *                     type:
 *                       type: string
 *                       description: Tipo de dato de la columna
 *                     values:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Valores de la columna
 *     responses:
 *       200:
 *         description: Validador creado con éxito.
 *       400:
 *         description: Error en la validación de los datos o nombre inválido.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /validators/updateName:
 *   put:
 *     summary: Update the name of a validator
 *     description: Actualiza el nombre de un validador existente.
 *     tags:
 *       - Validators
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre actual del validador
 *               newName:
 *                 type: string
 *                 description: Nuevo nombre para el validador
 *     responses:
 *       200:
 *         description: Nombre del validador actualizado con éxito.
 *       400:
 *         description: El nuevo nombre contiene caracteres inválidos.
 *       404:
 *         description: Validador no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /validators/update:
 *   put:
 *     summary: Update a validator
 *     description: Actualiza los detalles de un validador existente.
 *     tags:
 *       - Validators
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del validador
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     is_validator:
 *                       type: boolean
 *                     type:
 *                       type: string
 *                     values:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       200:
 *         description: Validador actualizado con éxito.
 *       404:
 *         description: Validador no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /validators/options:
 *   get:
 *     summary: Get validator options
 *     description: Obtiene las opciones de validadores disponibles.
 *     tags:
 *       - Validators
 *     responses:
 *       200:
 *         description: Opciones de validadores obtenidas con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 options:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /validators:
 *   get:
 *     summary: Get a validator by name
 *     description: Obtiene un validador específico por su nombre.
 *     tags:
 *       - Validators
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Nombre del validador
 *     responses:
 *       200:
 *         description: Validador obtenido con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 validator:
 *                   type: object
 *       404:
 *         description: Validador no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /validators/all:
 *   get:
 *     summary: Get all validators
 *     description: Obtiene una lista de todos los validadores.
 *     tags:
 *       - Validators
 *     responses:
 *       200:
 *         description: Lista de validadores obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /validators/pagination:
 *   get:
 *     summary: Get validators with pagination
 *     description: Obtiene una lista paginada de validadores con opciones de búsqueda.
 *     tags:
 *       - Validators
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
 *         description: Límite de validadores por página (por defecto 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtro de búsqueda para validadores
 *     responses:
 *       200:
 *         description: Lista paginada de validadores obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 validators:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: integer
 *                   description: Número total de páginas
 *                 currentPage:
 *                   type: integer
 *                   description: Página actual
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /validators/delete:
 *   delete:
 *     summary: Delete a validator by ID
 *     description: Elimina un validador específico por su ID.
 *     tags:
 *       - Validators
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID del validador a eliminar
 *     responses:
 *       200:
 *         description: Validador eliminado con éxito.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /validators/id:
 *   get:
 *     summary: Get a validator by ID
 *     description: Obtiene un validador específico por su ID.
 *     tags:
 *       - Validators
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del validador
 *     responses:
 *       200:
 *         description: Validador obtenido con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 validator:
 *                   type: object
 *       404:
 *         description: Validador no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
