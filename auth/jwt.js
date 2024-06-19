const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();
const secret = process.env.SECRET_KEY;
const user = require('../models/user')
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { body, validationResult } = require('express-validator');
router.post('/',[
    body('username').notEmpty().withMessage('Username is required').isString().withMessage('Username must be a string'),
    body('password').notEmpty().withMessage('Password is required').isString().withMessage('Password must be a string'),
],async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {username,password} = req.body;
    try{
        const verified_user =  await user.findOne({ where: { username } });
        if(!verified_user){
            return res.status(404).send('User not found');
        }
        const isMatch = await bcrypt.compare(password, verified_user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'invalid password' });
        }
        const payload = {
            user : {
                id : verified_user.id
            }
        }
        await jwt.sign(payload,secret, {expiresIn: '1h'},(err, token) => {
            if(err){
                return res.status(401).send(err)
            }
            return res.json({ token });
        });
        //next()

    }catch(err) {
        res.status(500).send(err.message)
    }
})
module.exports = router