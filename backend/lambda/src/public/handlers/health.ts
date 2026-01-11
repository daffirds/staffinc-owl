import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event) => {
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'staffinc-owl-public-api',
    }),
  };

  return response;
};
