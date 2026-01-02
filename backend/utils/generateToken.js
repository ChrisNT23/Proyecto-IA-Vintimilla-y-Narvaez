import jwt from 'jsonwebtoken';

const generateToken=(res,userId)=>{
    const token =jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:'30d'
    });
    
    //Modifica JWT como solo cookie de http
    res.cookie('jwt',token,{
        httpOnly:true,
        secure:process.env.NODE_ENV !== 'development',
        sameSite:'strict',
        maxAge:30*24*60*1000//30 dias
    });


}

export default generateToken;