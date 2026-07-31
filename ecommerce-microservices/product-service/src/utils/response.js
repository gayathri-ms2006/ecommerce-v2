module.exports = {
  success: (data, statusCode = 200) => ({
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods":
        "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify({
      success: true,
      data
    }),
  }),

  error: (err) => {
    const statusCode = err.statusCode || 500;
    const message =
      err.message || "Internal Server Error";
    const code =
      err.code || "INTERNAL_SERVER_ERROR";
    const details =
      err.details || null;

    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods":
          "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": true
      },
      body: JSON.stringify({
        success: false,
        error: {
          code,
          message,
          details
        }
      }),
    };
  }
};