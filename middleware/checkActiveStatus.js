const User = require('../models/users');

const checkActiveStatus = async (req, res, next) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User is not active' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = checkActiveStatus;
