import { Model, DataTypes } from 'sequelize'
import sequelize from '../db.js'

export class Pokemon extends Model {
  declare id: number
  declare name: string
  declare description?: string
  declare imageUrl?: string
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

Pokemon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'pokemons',
  }
)

export default Pokemon
