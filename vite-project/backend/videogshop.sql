-- Jogosultságok tábla
CREATE TABLE IF NOT EXISTS Jogosultsagok (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nev VARCHAR(100) NOT NULL,
    leiras TEXT
);

-- Felhasználók tábla
CREATE TABLE IF NOT EXISTS Felhasznalok (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Vezeteknev VARCHAR(100) NOT NULL,
    Keresztnev VARCHAR(100) NOT NULL,
    Iranyitoszam VARCHAR(10),
    Varos VARCHAR(100),
    Lakcim VARCHAR(255),
    Jelszo VARCHAR(255) NOT NULL,
    Jogosultsag INT,
    FOREIGN KEY (Jogosultsag) REFERENCES Jogosultsagok(id)
);

-- Termékek tábla
CREATE TABLE IF NOT EXISTS Termekek (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    Nev VARCHAR(255) NOT NULL,
    Allapot VARCHAR(50),
    Evjarat INT,
    Gyarto VARCHAR(100),
    AR DECIMAL(10,2)
);

-- Hirdetés tábla
CREATE TABLE IF NOT EXISTS Hirdetes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    Cim VARCHAR(255) NOT NULL,
    leiras TEXT,
    allapot VARCHAR(50),
    FelhasznaloID INT,
    TermekID INT,
    FOREIGN KEY (FelhasznaloID) REFERENCES Felhasznalok(ID),
    FOREIGN KEY (TermekID) REFERENCES Termekek(Id)
);

-- Képek tábla (a Hirdetés-hez kapcsolódik)
CREATE TABLE IF NOT EXISTS Kepek (
    id INT PRIMARY KEY AUTO_INCREMENT,
    HirdetesID INT NOT NULL,
    kep_url VARCHAR(500) NOT NULL,
    kep_nev VARCHAR(255),
    FOREIGN KEY (HirdetesID) REFERENCES Hirdetes(id) ON DELETE CASCADE
);

-- Vélemények tábla
CREATE TABLE IF NOT EXISTS Velemények (
    id INT PRIMARY KEY AUTO_INCREMENT,
    Datum DATETIME DEFAULT CURRENT_TIMESTAMP,
    Szoveg TEXT NOT NULL,
    Ertekeles INT CHECK (Ertekeles >= 1 AND Ertekeles <= 5),
    FelhasznaloID INT,
    HirdetesID INT,
    FOREIGN KEY (FelhasznaloID) REFERENCES Felhasznalok(ID),
    FOREIGN KEY (HirdetesID) REFERENCES Hirdetes(id)
);

-- Indexek létrehozása a gyorsabb működés érdekében
CREATE INDEX idx_felhasznalo_email ON Felhasznalok(Email);
CREATE INDEX idx_termek_nev ON Termekek(Nev);
CREATE INDEX idx_hirdetes_cim ON Hirdetes(Cim);
CREATE INDEX idx_velemeny_datum ON Velemények(Datum);

-- Alapvető jogosultságok beszúrása
INSERT INTO Jogosultsagok (id, nev, leiras) VALUES
(1, 'Admin', 'Teljes hozzáféréssel rendelkezik'),
(2, 'Felhasználó', 'Alapvető felhasználói jogok'),
(3, 'Vendég', 'Csak megtekintési jogok');

-- Kommentek a táblákhoz
ALTER TABLE Felhasznalok COMMENT = 'Felhasználók adatai';
ALTER TABLE Termekek COMMENT = 'Termékek adatai';
ALTER TABLE Hirdetes COMMENT = 'Termék hirdetések';
ALTER TABLE Kepek COMMENT = 'Hirdetésekhez tartozó képek';
ALTER TABLE Velemények COMMENT = 'Vélemények a hirdetésekről';
ALTER TABLE Jogosultsagok COMMENT = 'Felhasználói jogosultságok';