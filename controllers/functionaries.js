const { loadEnvFile } = require("process");
const axios = require('axios');

loadEnvFile();

FUNCTIONARIES_ENDPOINT = process.env.FUNCTIONARIES_ENDPOINT;

let functionaries = [];

async function loadFunctionaries(data) {
    await axios.get(FUNCTIONARIES_ENDPOINT)
    .then(response => {
        functionaries = response.data.map(functionary => {
            return {
                name: functionary.name,
                last_name: functionary.last_name,
                identification: functionary.identification,
                email: functionary.email,
                position: functionary.position
            };
        });
    })
    .catch(error => {
        console.error(error);
    });
}

const getFunctionaries = async (req, res) => {
    await loadFunctionaries();
    res.json(functionaries);
}

module.exports = {
    getFunctionaries
};
