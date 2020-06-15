db.createUser(
    {
        user: "admin",
        pwd: "example123",
        roles: [
            {
                role: "dbAdmin",
                db: "BotFramework"
            },
            {
                role: "readWrite",
                db: "BotFramework"
            }
        ]
    }
);

db = db.getSiblingDB('anon_ask_state');

db.createUser(
    {
        user: "anonAskBot",
        pwd: "example123",
        roles: [
            {
                role: "dbAdmin",
                db: "anon_ask_state"
            },
            {
                role: "readWrite",
                db: "anon_ask_state"
            }
        ]
    }
);