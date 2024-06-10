const { makeExtendSchemaPlugin, gql } = require("postgraphile");
const AWS = require("aws-sdk");

const cognito = new AWS.CognitoIdentityServiceProvider({
  region: "us-east-1",
});

const ResendOtpPlugin = makeExtendSchemaPlugin(build => ({
  typeDefs: gql`
    extend type Mutation {
      resendCode(email: String!): ResendCodeOutput
    }

    type ResendCodeOutput {
      message: String!
    }
  `,
  resolvers: {
    Mutation: {
      resendCode: async (_, { email }) => {
        try {
          console.log("Resend code for email:", email);

          await cognito.resendConfirmationCode({
            ClientId: "791diljkurip6gd34k086a4aki", // Specify your Cognito app client ID
            Username: email,
          }).promise();

          return {
            message: "Confirmation code resent successfully"
          };
        } catch (error) {
          console.error("Error resending confirmation code:", error);
          throw new Error("Failed to resend confirmation code");
        }
      },
    },
  },
}));

module.exports = ResendOtpPlugin;
