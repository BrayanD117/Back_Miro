const User = require("../models/users");

class UserService {
  static async findUserByEmail(email, session) {
    const user = await User.findOne({ email, isActive: true }).session(session)
    if (!user) throw new Error("User not found.")
    return user;
  }

  static async findUserByEmailAndRole(email, role, session) {
    const user = await User.findOne({ email, activeRole: role, isActive: true })
      .session(session);
    if (!user) throw new Error("User not found.")
    return user;
  }

  static async findUserByEmailAndRoles(email, roles) {
    const user = await User.findOne({ email, activeRole: { $in: roles } });
    if (!user) throw new Error("User not found.");
    return user;
  }
}

module.exports = UserService;