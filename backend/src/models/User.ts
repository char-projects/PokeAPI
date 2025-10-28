import { Model, DataTypes } from 'sequelize'
import sequelize from '../db.js'

export class User extends Model {
  declare id: number
  declare username: string
  declare passwordHash: string
  declare lastLogoutAt?: Date | null
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastLogoutAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
)

export default User
