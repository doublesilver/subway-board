const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Subway Board API',
            version: '1.0.0',
            description: 'API documentation for Subway Board (gagisiro.com)',
            contact: {
                name: 'Developer',
                url: 'https://gagisiro.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local Development Server',
            },
            {
                url: 'https://subway-board-backend-production.up.railway.app',
                description: 'Production Server (Railway)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['src/routes/*.js', 'src/controllers/*.js'], // Relative path from backend root (where npm start runs)
};

const specs = swaggerJsdoc(options);

module.exports = specs;
