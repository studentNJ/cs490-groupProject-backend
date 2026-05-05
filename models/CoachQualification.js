module.exports = (sequalize, DataTypes) => { //model for coach qualification
    const CoachQualification = sequalize.define("CoachQualification",{
        qualification_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        coach_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        degree_name:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        institution: {
            type:DataTypes.STRING,
            allowNull: false,
        },
        field_of_study: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        year_completed: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        document_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        
    },
    {
        tableName: "coach_qualification",
        underscored:true,
        timestamps: true,
    }

    );

    CoachQualification.associate = (models) => {
        CoachQualification.belongsTo(models.Coach, {
            foreignKey: "coach_id",
        });
    };

    return CoachQualification;
};