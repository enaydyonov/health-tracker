import { bootstrap } from "vesper";
import { GraphQLDate, GraphQLDateTime, GraphQLTime } from "graphql-iso-date";
import * as OktaJwtVerifier from '@okta/jwt-verifier';
import { CurrentUser } from './CurrentUser';
import { PointsController } from "./controller/PointsController";
import { Points } from "./entity/Points";
import { User } from "./entity/User";

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: '{yourClientId}',
  issuer: 'https://dev-278255.okta.com/oauth2/default'
});

bootstrap({
  port: 4000,
  controllers: [PointsController],
  entities: [Points, User],
  schemas: [__dirname + "/schema/**/*.graphql"],
  cors: true,
  setupContainer: async (container, action) => {
    const request = action.request;
    // require every request to have an authorization header
    if (!request.headers.authorization) {
      throw Error('Authorization header is required!');
    }
    let parts = request.headers.authorization.trim().split(' ');
    let accessToken = parts.pop();
    await oktaJwtVerifier.verifyAccessToken(accessToken)
      .then(async jwt => {
        const user = JSON.parse(request.headers['x-forwarded-user'].toString());
        const currentUser = new CurrentUser(jwt.claims.uid, user.given_name, user.family_name);
        container.set(CurrentUser, currentUser);
      })
      .catch(error => {
        throw Error('JWT Validation failed!');
      })
  },
  customResolvers: {
    Date: GraphQLDate,
    Time: GraphQLTime,
    DateTime: GraphQLDateTime
  }
})
  .then(() => {
    console.log(
      "Your app is up and running on http://localhost:4000. " +
        "You can use playground in development mode on http://localhost:4000/playground"
    );
  })
  .catch(error => {
    console.error(error.stack ? error.stack : error);
  });
