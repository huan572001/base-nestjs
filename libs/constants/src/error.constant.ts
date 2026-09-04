export const ErrorConstant = Object.freeze({
  // OO
  DEFAULT: {
    SUCCESS: {
      message: 'Success',
      errorCode: '000000',
    },
    FAILED: {
      message: 'Failed',
      errorCode: '000001',
    },
    VALIDATION: {
      message: 'Validation failed',
      errorCode: '000002',
    },
  },
  // 10
  TEMPLATE: {
    NOT_FOUND: {
      message: 'Template not found',
      errorCode: '100001',
    },
  },
  // 20
  AUTH: {
    USER_EXISTED: {
      message: 'User existed',
      errorCode: '200001',
    },
    UNAUTHORIZED: {
      message: 'Unauthorized',
      errorCode: '200002',
    },
    BAD_REQUEST: {
      message: 'Bad request',
      errorCode: '200003',
    },
    USER_NOT_ACTIVATE: {
      message: 'User not activate',
      errorCode: '200004',
    },
    INVALID_SIGNATURE: {
      message: 'Invalid signature',
      errorCode: '200005',
    },
    USER_NOT_FOUND: {
      message: 'User not found',
      errorCode: '200006',
    },
    INVALID_USERNAME: {
      message: 'Invalid username',
      errorCode: '200007',
    },
    INVALID_PASSWORD: {
      message: 'Invalid password',
      errorCode: '200008',
    },
    INVALID_GOOGLE_TOKEN: {
      message: 'Invalid Google token',
      errorCode: '200009',
    },
    USERNAME_OR_EMAIL_EXISTED: {
      message: 'Username or email existed',
      errorCode: '200010',
    },
    INVALID_RESET_TOKEN: {
      message: 'Invalid reset token',
      errorCode: '200011',
    },
    CAN_NOT_RESET_WITH_GOOGLE_ACCOUNT: {
      message: 'Can not reset password with Google account',
      errorCode: '200012',
    },
    USERMANE_OR_PASSWORD_NOT_MATCH: {
      message: 'Username/email or password is incorrect. Please try again!',
      errorCode: '200013',
    },
  },
  // 30
  TRADING: {
    // Invalid signature
    INVALID_SIGNATURE: {
      message: 'Invalid signature',
      errorCode: '300001',
    },
    // Unauthorized address account
    UNAUTHORIZED_ADDRESS: {
      message: 'Unauthorized address account',
      errorCode: '300002',
    },
    // Trading not found
    TRADING_NOT_FOUND: {
      message: 'Trading not found',
      errorCode: '300003',
    },
    // Exist offline trading proposal
    EXIST_OFFLINE_TRADING_PROPOSAL: {
      message: 'Exist offline trading proposal',
      errorCode: '300004',
    },
  },

  // 40
  USER: {
    /// Can not follow yourself
    CAN_NOT_FOLLOW_YOURSELF: {
      message: 'Can not follow/unfollow yourself',
      errorCode: '400001',
    },
    // User not found
    USER_NOT_FOUND: {
      message: 'User not found',
      errorCode: '400002',
    },
    // Already following this user
    ALREADY_FOLLOWING: {
      message: 'Already following this user',
      errorCode: '400003',
    },
    // Not following this user
    NOT_FOLLOWING: {
      message: 'Not following this user',
      errorCode: '400004',
    },
  },

  // 50
});
