var express = require('express');
var router = express.Router();
require('dotenv').config();
const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
    host: process.env.MEILISEARCH_URL,
    apiKey :process.env.API_KEY
});

/* GET home page. */
router.get('/', async function(req, res) {
    try {
        const { data } = req.query;

        if (!data) {
            return res.status(400).send({ error: 'Query parameter "data" is required' });
        }

        const response = await client.index('Accessories').search(data);
        const info = response.hits;

        if (info.length === 0) {
            return res.status(404).send({ message: 'No documents found matching the query.' });
        }



        res.status(200).send({ "data": info });
    } catch (err) {
        console.error('Error searching documents in MeiliSearch:', err);
        res.status(500).send({ error: 'An error occurred while searching documents. Please try again later.' });
    }
});

module.exports = router;