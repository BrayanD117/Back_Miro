/**
 * @swagger
 * tags:
 *   - name: Dependencies
 *     description: Endpoints relacionados con dependencias
 */

/**
 * @swagger
 * /dependencies/all:
 *   get:
 *     summary: Retrieve all dependencies
 *     description: Obtiene una lista de todas las dependencias.
 *     tags:
 *       - Dependencies
 *     responses:
 *       200:
 *         description: Lista de dependencias obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /dependencies:
 *   get:
 *     summary: Retrieve a specific dependency
 *     description: Obtiene una dependencia específica por su código de dependencia.
 *     tags:
 *       - Dependencies
 *     parameters:
 *       - in: query
 *         name: dep_code
 *         schema:
 *           type: string
 *         required: true
 *         description: Código de la dependencia
 *     responses:
 *       200:
 *         description: Dependencia obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Dependencia no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dependencies/updateAll:
 *   post:
 *     summary: Update all dependencies
 *     description: Actualiza todas las dependencias desde un servicio externo.
 *     tags:
 *       - Dependencies
 *     responses:
 *       200:
 *         description: Dependencias actualizadas con éxito.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dependencies/setResponsible:
 *   put:
 *     summary: Set a responsible for a dependency
 *     description: Asigna un responsable a una dependencia específica.
 *     tags:
 *       - Dependencies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dep_code:
 *                 type: string
 *                 description: Código de la dependencia
 *               email:
 *                 type: string
 *                 description: Correo electrónico del responsable
 *     responses:
 *       200:
 *         description: Responsable asignado con éxito.
 *       404:
 *         description: Dependencia no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dependencies/{dep_code}/members:
 *   get:
 *     summary: Retrieve members of a specific dependency
 *     description: Obtiene una lista de miembros asociados a una dependencia específica.
 *     tags:
 *       - Dependencies
 *     parameters:
 *       - in: path
 *         name: dep_code
 *         schema:
 *           type: string
 *         required: true
 *         description: Código de la dependencia
 *     responses:
 *       200:
 *         description: Lista de miembros obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       404:
 *         description: Dependencia no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dependencies/{id}:
 *   put:
 *     summary: Update a specific dependency
 *     description: Actualiza una dependencia específica por su ID.
 *     tags:
 *       - Dependencies
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la dependencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dep_code:
 *                 type: string
 *               name:
 *                 type: string
 *               responsible:
 *                 type: string
 *               dep_father:
 *                 type: string
 *               producers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Dependencia actualizada con éxito.
 *       404:
 *         description: Dependencia no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dependencies/members:
 *   get:
 *     summary: Retrieve members including those from the parent dependency
 *     description: Obtiene una lista de miembros de una dependencia específica y de su dependencia padre.
 *     tags:
 *       - Dependencies
 *     parameters:
 *       - in: query
 *         name: dep_code
 *         schema:
 *           type: string
 *         required: true
 *         description: Código de la dependencia
 *     responses:
 *       200:
 *         description: Lista de miembros obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                 fatherMembers:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Dependencia no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /dependencies/names:
 *   post:
 *     summary: Retrieve dependency names by codes
 *     description: Obtiene los nombres de dependencias específicas por sus códigos.
 *     tags:
 *       - Dependencies
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Nombres de dependencias obtenidos con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   code:
 *                     type: string
 *                   name:
 *                     type: string
 *       500:
 *         description: Error interno del servidor.
 */
