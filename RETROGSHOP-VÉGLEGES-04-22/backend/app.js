const express = require('express');

const cors = require('cors');

const app = express();
cont = PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/termekek", require('./Routes/termekRoutes'));



app.listen(PORT, () => {
    console.log('Server is running on port 4000');
    

});





app.get('/termekek', (req, res) => {
    
});