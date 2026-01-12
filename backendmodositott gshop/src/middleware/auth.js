import jwt from 'jsonwebtoken';


export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Hozzáférés megtagadva. Token szükséges.' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Érvénytelen token.' });
    }
};


export const adminMiddleware = async (req, res, next) => {
    try {
 
        authMiddleware(req, res, async () => {
          
            next();
        });
    } catch (error) {
        res.status(403).json({ error: 'Hozzáférés megtagadva.' });
    }
};