const axios = require('axios');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImZMVnpwelFtUEkxTk1kWkYzcnpuIiwidmVyc2lvbiI6MSwiaWF0IjoxNzQ2ODczMjEyNzI3LCJzdWIiOiI1ckhqcnRMRzRyaG1NNmVuaFNHUiJ9.heLYdf6cQcIWZA0ReauFvhd3saTi2_kUgQY7T5w15MU';
const API_URL = 'https://rest.gohighlevel.com/v1/contacts';

async function crteate_crm_user(res) {
    try {
        const data = {
            firstName: res.fname,
            lastName: res.lname,
            email: res.email,
            phone: '',
            locationId: 'fLVzpzQmPI1NMdZF3rzn'
        };

        const response = await axios.post(API_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        console.log('CRM Response Code:', response.status);
        console.log('CRM Response:', response.data);

        return response.data;

    } catch (error) {
        if (error.response) {
            // Request made and server responded
            console.error('CRM Error:', error.response.status, error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error('CRM No Response:', error.request);
        } else {
            console.error('CRM Error:', error.message);
        }
        return null;
    }
}

module.exports = { crteate_crm_user };
