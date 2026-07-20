const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(
process.env.GOOGLE_CLIENT_ID
);

const generateToken = (user) => {
return jwt.sign(
{
id: user._id,
role: user.role,
},
process.env.JWT_SECRET || 'secretkey',
{
expiresIn: '7d',
}
);
};

router.post('/register', async (req, res) => {
try {
const { name, email, password } = req.body;

```
const userExists = await User.findOne({ email });

if (userExists) {
  return res.status(400).json({
    message: 'Utilisateur déjà existant',
  });
}

const user = await User.create({
  name,
  email,
  password,
});

const token = generateToken(user);

res.status(201).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token,
});
```

} catch (error) {
console.error("Erreur d'inscription:", error);

```
res.status(500).json({
  message: error.message,
});
```

}
});

router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;

```
const user = await User.findOne({ email });

if (
  user &&
  (await bcrypt.compare(password, user.password))
) {
  const token = generateToken(user);

  return res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  });
}

return res.status(401).json({
  message: 'Email ou mot de passe incorrect',
});
```

} catch (error) {
console.error('Erreur de connexion:', error);

```
return res.status(500).json({
  message: error.message,
});
```

}
});

module.exports = router;
