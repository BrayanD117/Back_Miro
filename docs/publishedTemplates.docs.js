/**
 * @swagger
 * tags:
 *   - name: Published Templates
 *     description: Endpoints relacionados con las plantillas publicadas
 */

/**
 * @swagger
 * /publishedTemplates/publish:
 *   post:
 *     summary: Publish a template
 *     description: Publica una plantilla para que los productores puedan cargar datos.
 *     tags:
 *       - Published Templates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_id:
 *                 type: string
 *                 description: ID de la plantilla a publicar
 *               user_email:
 *                 type: string
 *                 description: Correo electrónico del usuario que publica la plantilla
 *               name:
 *                 type: string
 *                 description: Nombre de la plantilla publicada
 *               period_id:
 *                 type: string
 *                 description: ID del periodo asociado
 *               producers_dep_code:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Códigos de dependencia de los productores asignados
 *     responses:
 *       201:
 *         description: Plantilla publicada con éxito.
 *       404:
 *         description: Plantilla o usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates:
 *   get:
 *     summary: Retrieve assigned templates for a producer
 *     description: Obtiene una lista de plantillas asignadas a un productor específico.
 *     tags:
 *       - Published Templates
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del productor
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
 *         description: Lista de plantillas asignadas obtenida con éxito.
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
 *                   description: Número total de plantillas asignadas
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates/available:
 *   get:
 *     summary: Retrieve available templates for a producer
 *     description: Obtiene una lista de plantillas disponibles para cargar datos, que aún no han sido cargadas por un productor específico.
 *     tags:
 *       - Published Templates
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del productor
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
 *         description: Lista de plantillas disponibles obtenida con éxito.
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
 *                   description: Número total de plantillas disponibles
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates/feedOptions:
 *   get:
 *     summary: Retrieve options to publish a template
 *     description: Obtiene las opciones disponibles para publicar una plantilla, incluyendo periodos activos y productores.
 *     tags:
 *       - Published Templates
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del responsable
 *     responses:
 *       200:
 *         description: Opciones obtenidas con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 periods:
 *                   type: array
 *                   items:
 *                     type: object
 *                 producers:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Dimensión o usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates/producer/load:
 *   put:
 *     summary: Load data for a producer
 *     description: Carga datos de un productor en una plantilla publicada.
 *     tags:
 *       - Published Templates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del productor
 *               pubTem_id:
 *                 type: string
 *                 description: ID de la plantilla publicada
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Datos a cargar
 *               edit:
 *                 type: boolean
 *                 description: Si es true, edita los datos existentes; si es false, añade nuevos datos.
 *     responses:
 *       200:
 *         description: Datos cargados con éxito.
 *       400:
 *         description: Error de validación o datos no encontrados.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates/uploaded:
 *   get:
 *     summary: Retrieve uploaded templates by a producer
 *     description: Obtiene una lista de plantillas que ya han sido cargadas por un productor específico.
 *     tags:
 *       - Published Templates
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del productor
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
 *         description: Lista de plantillas cargadas obtenida con éxito.
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
 *                   description: Número total de plantillas cargadas
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates/producer/delete:
 *   delete:
 *     summary: Delete loaded data for a producer
 *     description: Elimina los datos cargados por un productor en una plantilla publicada.
 *     tags:
 *       - Published Templates
 *     parameters:
 *       - in: query
 *         name: pubTem_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la plantilla publicada
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del productor
 *     responses:
 *       200:
 *         description: Datos eliminados con éxito.
 *       404:
 *         description: Plantilla o usuario no encontrado, o datos no encontrados.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates/dimension:
 *   get:
 *     summary: Retrieve published templates by dimension
 *     description: Obtiene una lista de plantillas publicadas asociadas a una dimensión específica.
 *     tags:
 *       - Published Templates
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del responsable de la dimensión
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
 *         description: Lista de plantillas publicadas obtenida con éxito.
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
 *                   description: Número total de plantillas publicadas
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates/dimension/mergedData:
 *   get:
 *     summary: Retrieve merged data for a dimension
 *     description: Obtiene los datos combinados cargados por todos los productores de una dimensión específica.
 *     tags:
 *       - Published Templates
 *     parameters:
 *       - in: query
 *         name: pubTem_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la plantilla publicada
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Correo electrónico del responsable de la dimensión
 *     responses:
 *       200:
 *         description: Datos combinados obtenidos con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Usuario o plantilla no encontrados.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /publishedTemplates/template/{id}:
 *   get:
 *     summary: Retrieve a published template by ID
 *     description: Obtiene una plantilla publicada específica por su ID.
 *     tags:
 *       - Published Templates
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la plantilla publicada
 *     responses:
 *       200:
 *         description: Plantilla publicada obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 template:
 *                   type: object
 *       404:
 *         description: Plantilla publicada no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
