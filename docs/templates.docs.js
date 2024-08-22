/**
 * @swagger
 * tags:
 *   - name: Templates
 *     description: Endpoints relacionados con plantillas
 */

/**
 * @swagger
 * /templates/creator:
 *   get:
 *     summary: Retrieve templates by creator
 *     description: Obtiene una lista de plantillas creadas por un usuario específico.
 *     tags:
 *       - Templates
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del creador de la plantilla
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página solicitada (por defecto 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de plantillas por página (por defecto 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtro de búsqueda para plantillas
 *     responses:
 *       200:
 *         description: Lista de plantillas obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                   description: Número total de plantillas
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /templates/all:
 *   get:
 *     summary: Retrieve all templates
 *     description: Obtiene una lista de todas las plantillas con paginación y búsqueda.
 *     tags:
 *       - Templates
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
 *         description: Límite de plantillas por página (por defecto 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtro de búsqueda para plantillas
 *     responses:
 *       200:
 *         description: Lista de plantillas obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                   description: Número total de plantillas
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /templates/{id}:
 *   get:
 *     summary: Retrieve a specific template
 *     description: Obtiene una plantilla específica por su ID.
 *     tags:
 *       - Templates
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Plantilla no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /templates/create:
 *   post:
 *     summary: Create a new template
 *     description: Crea una nueva plantilla.
 *     tags:
 *       - Templates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la plantilla
 *               file_name:
 *                 type: string
 *                 description: Nombre del archivo asociado
 *               file_description:
 *                 type: string
 *                 description: Descripción del archivo
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     datatype:
 *                       type: string
 *                     required:
 *                       type: boolean
 *                     validate_with:
 *                       type: string
 *                     comment:
 *                       type: string
 *               active:
 *                 type: boolean
 *                 description: Estado de la plantilla (activo/inactivo)
 *               email:
 *                 type: string
 *                 description: Correo electrónico del creador
 *     responses:
 *       200:
 *         description: Plantilla creada con éxito.
 *       400:
 *         description: El nombre de la plantilla ya existe o errores de validación.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /templates/{id}:
 *   put:
 *     summary: Update a specific template
 *     description: Actualiza una plantilla específica por su ID.
 *     tags:
 *       - Templates
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la plantilla
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               file_name:
 *                 type: string
 *               file_description:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     datatype:
 *                       type: string
 *                     required:
 *                       type: boolean
 *                     validate_with:
 *                       type: string
 *                     comment:
 *                       type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plantilla actualizada con éxito.
 *       404:
 *         description: Plantilla no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /templates/delete:
 *   delete:
 *     summary: Delete a specific template
 *     description: Elimina una plantilla específica por su ID.
 *     tags:
 *       - Templates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla eliminada con éxito.
 *       404:
 *         description: Plantilla no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
