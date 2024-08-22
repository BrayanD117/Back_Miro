/**
 * @swagger
 * tags:
 *   - name: Dimensions
 *     description: Endpoints relacionados con dimensiones
 */

/**
 * @swagger
 * /dimensions:
 *   get:
 *     summary: Retrieve all dimensions
 *     description: Obtiene una lista de todas las dimensiones.
 *     tags:
 *       - Dimensions
 *     responses:
 *       200:
 *         description: Lista de dimensiones obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /dimensions/all:
 *   get:
 *     summary: Retrieve paginated list of dimensions
 *     description: Obtiene una lista paginada de dimensiones con opciones de búsqueda.
 *     tags:
 *       - Dimensions
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
 *         description: Límite de dimensiones por página (por defecto 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtro de búsqueda para dimensiones
 *     responses:
 *       200:
 *         description: Lista paginada de dimensiones obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dimensions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                   description: Número total de dimensiones
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 */

/**
 * @swagger
 * /dimensions/responsible:
 *   get:
 *     summary: Retrieve dimensions by responsible
 *     description: Obtiene una lista de dimensiones asociadas a un responsable específico.
 *     tags:
 *       - Dimensions
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del responsable
 *     responses:
 *       200:
 *         description: Lista de dimensiones obtenida con éxito.
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
 * /dimensions/create:
 *   post:
 *     summary: Create a new dimension
 *     description: Crea una nueva dimensión.
 *     tags:
 *       - Dimensions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la dimensión
 *               responsible:
 *                 type: string
 *                 description: Correo electrónico del responsable
 *               producers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de códigos de productores
 *     responses:
 *       200:
 *         description: Dimensión creada con éxito.
 *       400:
 *         description: La dimensión con ese nombre ya existe.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dimensions/{id}:
 *   put:
 *     summary: Update a dimension
 *     description: Actualiza una dimensión existente.
 *     tags:
 *       - Dimensions
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la dimensión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               responsible:
 *                 type: string
 *               producers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Dimensión actualizada con éxito.
 *       404:
 *         description: Dimensión no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dimensions/{id}:
 *   delete:
 *     summary: Delete a dimension
 *     description: Elimina una dimensión existente.
 *     tags:
 *       - Dimensions
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la dimensión
 *     responses:
 *       200:
 *         description: Dimensión eliminada con éxito.
 *       404:
 *         description: Dimensión no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dimensions/producers/{id}:
 *   get:
 *     summary: Retrieve producers by dimension
 *     description: Obtiene una lista de productores asociados a una dimensión específica.
 *     tags:
 *       - Dimensions
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la dimensión
 *     responses:
 *       200:
 *         description: Lista de productores obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Dimensión no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
