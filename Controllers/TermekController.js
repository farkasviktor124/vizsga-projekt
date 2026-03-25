const dbPath = path.join(__dirname, 'webshopretrog.db');

const getTermek = (req, res) => {
      const sql = 'SELECT * FROM termekek';
    connection.query(sql, (err, rows) => {
        if (err) {
            res.json(err);
        }
        else {
            res.json(rows);
        }
    });

};     
const ujTermek = (req, res) => {
    const { nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras } = req.body;
    const sql = `INSERT INTO termek (nev, ar, allapot, evjarat, gyarto, arus, termekTipus, leiras) VALUES ("${nev}","${ar}","${allapot}","${evjarat}","${gyarto}","${arus}","${termekTipus}","${leiras}")`;
    connection.query(sql, (err,) => {
        if (err) {
            res.json(err);
        }
        else {
            res.json({ message: "Siker" });
        }

    });


}




module.exports = { ujTermek, getTermek };