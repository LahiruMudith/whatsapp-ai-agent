const userSessions = {};

function getSession(phoneNumber) {
    if (!userSessions[phoneNumber]) {
        userSessions[phoneNumber] = { state: 'idle', orderData: null };
    }

    return userSessions[phoneNumber];
}

function resetSession(phoneNumber) {
    userSessions[phoneNumber] = { state: 'idle', orderData: null };
}

module.exports = {
    getSession,
    resetSession
};
