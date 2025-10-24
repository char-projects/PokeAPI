import { Model, DataTypes } from 'sequelize'
import sequelize from '../db.js'

export class Pokemon extends Model {
  public id!: number
  public name!: string
  public description?: string
  public imageUrl?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Pokemon.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
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
