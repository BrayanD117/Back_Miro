const User = require("../models/users");

class UserService {
  static async findUserByEmail(email, session) {
    return await User.findOne({ email, isActive: true }).session(session);
  }

  static async findUserByEmailAndRole(email, role, session) {
    return await User.findOne({ email, activeRole: role, isActive: true })
      .session(session);
  }
}