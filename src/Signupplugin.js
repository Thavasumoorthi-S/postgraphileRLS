const { makeExtendSchemaPlugin, gql } = require("postgraphile");
const AWS = require("aws-sdk");
const { Pool } = require("pg");

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: "us-east-1", // Specify the AWS region where your Cognito user pool is located
});

const pool = new Pool({
  connectionString: "postgres://postgres:root@localhost:5432/postgraphilerls3", // Ensure this environment variable is set to your database connection string
});

const Signupplugin = makeExtendSchemaPlugin(build => ({
  typeDefs: gql`
    extend type Mutation {
      createUsers(input: CreateUserInput1!): CreateUserOutput1
    }

    input CreateUserInput1 {
      name: String!
      email: String!
      password: String!
    }

    type CreateUserOutput1 {
      message: String!
    }
  `,
  resolvers: {
    Mutation: {
      createUsers: async (_, { input }) => {
        const client = await pool.connect();
        try {
          const { name, email, password } = input;

          console.log("Received input:", input);

          // Call AWS Cognito to create a new user
          const cognitoSignUpResponse = await cognito.signUp({
            ClientId: "791diljkurip6gd34k086a4aki",
            Username: email,
            Password: password,
            UserAttributes: [
              { Name: "name", Value: name },
              { Name: "email", Value: email }
            ]
          }).promise();

          // Get cognito identity ID from the signUp response
          const cognitoId = cognitoSignUpResponse.UserSub;

          // Add user to 'anonymous1' group
          await cognito.adminAddUserToGroup({
            UserPoolId: "us-east-1_qpN00sPqK", // Replace with your User Pool ID
            Username: email,
            GroupName: "blog_user"
          }).promise();

          // Insert user record into the database
          const insertUserQuery = `
            INSERT INTO users (name, email, password,cognitoid)
            VALUES ($1, $2, $3,$4)
            RETURNING id
          `;
          const res = await client.query(insertUserQuery, [name, email, password,cognitoId]);
          const userId = res.rows[0].id;

          console.log("Inserted user with ID:", userId);

          return {
            message: "User created successfully"
          };
        } catch (error) {
          console.error("Error creating user:", error);
          throw new Error("Failed to create user");
        } finally {
          client.release();
        }
      },
    },
  },
}));

module.exports = Signupplugin;
