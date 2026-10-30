export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "MA Creation LMS & Services API",
    version: "1.0.0",
    description: `API Documentation for **MA Creation LMS & Services**.
    
### 📱 Mobile / Flutter Developer Notes:
* **Base URL:** Use \`https://<tunnel-domain>/api\` for calling endpoints.
* **Mobile Platform Header:** Send \`x-client-platform: APP\` in headers for \`/auth/login\` and \`/auth/register\` so the backend returns \`refreshToken\` directly in the JSON response (instead of an HttpOnly cookie).
* **Authorization:** For protected endpoints, pass the JWT access token in the header as:
  \`Authorization: Bearer <accessToken>\``,
  },
  servers: [
    {
      url: "/api",
      description: "API Base Path (/api)",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your Bearer token: Bearer <token>",
      },
      clientPlatform: {
        type: "apiKey",
        in: "header",
        name: "x-client-platform",
        description: "Send 'APP' or 'MOBILE' to receive refreshToken in JSON body",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error description" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "phone"],
        properties: {
          name: { type: "string", example: "Rahul Sharma" },
          email: { type: "string", format: "email", example: "rahul@example.com" },
          password: { type: "string", minLength: 8, example: "Password@123" },
          phone: { type: "string", example: "9876543210" },
          company: { type: "string", example: "ABC Tech" },
          interest: { type: "string", example: "Flutter Development" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "rahul@example.com" },
          password: { type: "string", example: "Password@123" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          token: { type: "string", description: "JWT Access Token" },
          accessToken: { type: "string", description: "Same as token" },
          refreshToken: { type: "string", description: "Provided when x-client-platform is APP" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              phone: { type: "string" },
            },
          },
        },
      },
      OrderRequest: {
        type: "object",
        required: ["planId", "name", "email", "phone"],
        properties: {
          planId: { type: "string", example: "66f1234567890abcdef12345" },
          name: { type: "string", example: "Rahul Sharma" },
          email: { type: "string", example: "rahul@example.com" },
          phone: { type: "string", example: "9876543210" },
          company: { type: "string", example: "Freelancer" },
        },
      },
      LeadRequest: {
        type: "object",
        required: ["phone", "type"],
        properties: {
          type: { type: "string", enum: ["demo", "callback"], example: "demo" },
          name: { type: "string", example: "Rahul Sharma" },
          email: { type: "string", example: "rahul@example.com" },
          phone: { type: "string", example: "9876543210" },
          message: { type: "string", example: "Interested in course details" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System Health"],
        summary: "Check API & Database Health",
        description: "Returns database connection state and service availability.",
        responses: {
          200: {
            description: "Service is healthy and MongoDB is connected",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    status: { type: "string", example: "ok" },
                    service: { type: "string", example: "ma-creation-api" },
                    database: { type: "number", example: 1 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register new student/user",
        parameters: [
          {
            in: "header",
            name: "x-client-platform",
            schema: { type: "string", default: "APP" },
            description: "Pass APP for Mobile/Flutter apps",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User Login",
        description: "Pass `x-client-platform: APP` in header so Flutter receives refreshToken in JSON body.",
        parameters: [
          {
            in: "header",
            name: "x-client-platform",
            schema: { type: "string", default: "APP" },
            description: "Pass APP for Mobile/Flutter apps",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh Access Token",
        description: "Mobile clients pass refreshToken in request body with header `x-client-platform: APP`.",
        parameters: [
          {
            in: "header",
            name: "x-client-platform",
            schema: { type: "string", default: "APP" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string", example: "eyJhbGciOi..." },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "New access token generated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current logged-in user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { type: "object" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/change-password": {
      post: {
        tags: ["Authentication"],
        summary: "Change user password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", example: "OldPass@123" },
                  newPassword: { type: "string", minLength: 8, example: "NewPass@123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password changed successfully" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout current session",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "header",
            name: "x-client-platform",
            schema: { type: "string", default: "APP" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Logged out" },
        },
      },
    },
    "/catalog/plans": {
      get: {
        tags: ["Catalog & Plans"],
        summary: "List all active course and subscription plans",
        responses: {
          200: {
            description: "List of plans",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    plans: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/catalog/services": {
      get: {
        tags: ["Catalog & Plans"],
        summary: "List all active services",
        responses: {
          200: {
            description: "List of services",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    services: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/courses/mine": {
      get: {
        tags: ["Courses & LMS"],
        summary: "List all purchased/enrolled courses for the logged-in user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User enrolled courses categorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    categories: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/courses/has-access": {
      get: {
        tags: ["Courses & LMS"],
        summary: "Check if the logged-in user has any active course access",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Has access status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    hasCourses: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/courses/{courseId}/videos": {
      get: {
        tags: ["Courses & LMS"],
        summary: "Get video lessons list for an entitled course",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "courseId",
            required: true,
            schema: { type: "string" },
            description: "MongoDB ObjectID of the course",
          },
        ],
        responses: {
          200: {
            description: "Videos list with watch metadata",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    course: { type: "object" },
                    videos: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/videos/{videoId}/playback-token": {
      post: {
        tags: ["Video Streaming & DRM"],
        summary: "Request video playback token / session",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "videoId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Playback token generated with stream URLs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    token: { type: "string" },
                    hlsUrl: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/videos/{videoId}/watch-event": {
      post: {
        tags: ["Video Streaming & DRM"],
        summary: "Report video watch heartbeat / event",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "videoId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "seconds"],
                properties: {
                  token: { type: "string", description: "Playback session token" },
                  seconds: { type: "number", example: 10 },
                  type: { type: "string", example: "heartbeat" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Watch event saved" },
        },
      },
    },
    "/videos/{videoId}/hls/manifest.m3u8": {
      get: {
        tags: ["Video Streaming & DRM"],
        summary: "Stream HLS playlist for encrypted video playback",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "videoId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "HLS m3u8 playlist stream",
            content: { "application/vnd.apple.mpegurl": {} },
          },
        },
      },
    },
    "/videos/{videoId}/key": {
      get: {
        tags: ["Video Streaming & DRM"],
        summary: "Fetch AES-128 HLS Decryption Key for playback",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "videoId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Raw 16-byte AES-128 key",
            content: { "application/octet-stream": {} },
          },
        },
      },
    },
    "/payments/order": {
      post: {
        tags: ["Payments"],
        summary: "Create Razorpay order for purchasing a plan",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/OrderRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Razorpay order object with orderId and amount",
          },
        },
      },
    },
    "/payments/verify": {
      post: {
        tags: ["Payments"],
        summary: "Verify Razorpay payment signature after successful checkout",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
                properties: {
                  razorpay_order_id: { type: "string" },
                  razorpay_payment_id: { type: "string" },
                  razorpay_signature: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Payment verified successfully & plan unlocked" },
        },
      },
    },
    "/payments/mine": {
      get: {
        tags: ["Payments"],
        summary: "List user purchase / transaction history",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Array of user payment receipts",
          },
        },
      },
    },
    "/leads": {
      post: {
        tags: ["Leads & Contacts"],
        summary: "Submit a Demo or Callback enquiry request",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LeadRequest" },
            },
          },
        },
        responses: {
          201: { description: "Lead enquiry received" },
        },
      },
    },
  },
};

