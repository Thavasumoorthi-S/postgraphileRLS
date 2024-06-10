const { makeExtendSchemaPlugin, gql } = require("postgraphile");
const AWS = require("aws-sdk");

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: "us-east-1", // Specify the AWS region where your Cognito user pool is located
});

const clientId = "791diljkurip6gd34k086a4aki"; // Replace with your Cognito app client ID

const LoginPlugin = makeExtendSchemaPlugin(build => ({
  typeDefs: gql`
    extend type Mutation {
      performsignin(email: String!, password: String!): LoginOutput
    }

    type LoginOutput {
      accessToken: String
      refreshToken: String
      idToken: String
      message: String
    }
  `,
  resolvers: {
    Mutation: {
      performsignin: async (_, { email, password }) => {
        const params = {
          USERNAME: email,
          PASSWORD: password,
        };
        console.log(params);

        try {
          const authResponse = await cognito.initiateAuth({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: clientId,
            AuthParameters: {
              USERNAME: email,
              PASSWORD: password,
            },
          }).promise();

          const accessToken = authResponse.AuthenticationResult?.AccessToken;
          const refreshToken = authResponse.AuthenticationResult?.RefreshToken;
          const idToken = authResponse.AuthenticationResult?.IdToken;

          console.log({ accessToken, refreshToken, idToken });

          return {
            accessToken,
            refreshToken,
            idToken,
            message: "Login successful",
          };
        } catch (error) {
          console.error('Error logging in the user:', error);
          throw new Error("Failed to log in user");
        }
      },
    },
  },
}));

module.exports = LoginPlugin;
