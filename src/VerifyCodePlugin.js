const { makeExtendSchemaPlugin, gql } = require("postgraphile");
const AWS = require("aws-sdk");

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: "us-east-1", // Specify the AWS region where your Cognito user pool is located
});

const VerifyCodePlugin = makeExtendSchemaPlugin(build => ({
  typeDefs: gql`
    extend type Mutation {
      verifyCode(email: String!, code: String!): VerifyCodeOutput
    }

    type VerifyCodeOutput {
      message: String!
    }
  `,
  resolvers: {
    Mutation: {
      verifyCode: async (_, { email, code }) => {
        const params = {
          ClientId: "791diljkurip6gd34k086a4aki", // Specify your Cognito app client ID
          Username: email,
          ConfirmationCode: code,
        };

        try {
          const verifyResponse = await cognito.confirmSignUp(params).promise();
          console.log(verifyResponse);
          return {
            message: "Sign-up confirmed successfully",
          };
        } catch (error) {
          console.error('Error confirming sign-up:', error);
         
          throw new Error("Failed to confirm sign-up");
        }
      },
    },
  },
}));

module.exports = VerifyCodePlugin;
