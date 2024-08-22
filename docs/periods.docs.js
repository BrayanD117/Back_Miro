/**
 * @swagger
 * tags:
 *   - name: Periods
 *     description: Endpoints relacionados con periodos
 */

/**
 * @swagger
 * /periods/all:
 *   get:
 *     summary: Retrieve all periods
 *     description: Obtiene una lista de todos los periodos con paginación y búsqueda.
 *     tags:
 *       - Periods
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
 *         description: Límite de periodos por página (por defecto 10)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtro de búsqueda para periodos
 *     responses:
 *       200:
 *         description: Lista de periodos obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 periods:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                   description: Número total de periodos
 *                 page:
 *                   type: integer
 *                   description: Página actual
 *                 pages:
 *                   type: integer
 *                   description: Número total de páginas
 */

/**
 * @swagger
 * /periods:
 *   get:
 *     summary: Retrieve a specific period
 *     description: Obtiene un periodo específico por su fecha de inicio.
 *     tags:
 *       - Periods
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *         required: true
 *         description: Fecha de inicio del periodo
 *     responses:
 *       200:
 *         description: Periodo obtenido con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Periodo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /periods/active:
 *   get:
 *     summary: Retrieve active periods
 *     description: Obtiene una lista de todos los periodos activos.
 *     tags:
 *       - Periods
 *     responses:
 *       200:
 *         description: Lista de periodos activos obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /periods/create:
 *   post:
 *     summary: Create a new period
 *     description: Crea un nuevo periodo.
 *     tags:
 *       - Periods
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del periodo
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de inicio del periodo
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de finalización del periodo
 *               producer_start_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de inicio del periodo para productores
 *               producer_end_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de finalización del periodo para productores
 *               responsible_start_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de inicio del periodo para responsables
 *               responsible_end_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de finalización del periodo para responsables
 *               is_active:
 *                 type: boolean
 *                 description: Estado del periodo (activo/inactivo)
 *     responses:
 *       200:
 *         description: Periodo creado con éxito.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /periods/{id}:
 *   put:
 *     summary: Update a specific period
 *     description: Actualiza un periodo específico por su ID.
 *     tags:
 *       - Periods
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del periodo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               producer_start_date:
 *                 type: string
 *                 format: date
 *               producer_end_date:
 *                 type: string
 *                 format: date
 *               responsible_start_date:
 *                 type: string
 *                 format: date
 *               responsible_end_date:
 *                 type: string
 *                 format: date
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Periodo actualizado con éxito.
 *       404:
 *         description: Periodo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /periods/{id}:
 *   delete:
 *     summary: Delete a specific period
 *     description: Elimina un periodo específico por su ID.
 *     tags:
 *       - Periods
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del periodo
 *     responses:
 *       200:
 *         description: Periodo eliminado con éxito.
 *       404:
 *         description: Periodo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
