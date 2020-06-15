# Troubleshooting

## Contributing and committing code

### Question: When trying to start the bot server, I get a ```MongoError: Authentication failed.``` error.

**Issue:**

When trying to start the bot server, I get a ```MongoError: Authentication failed.``` error.
```sh
    anon_ask_node     | Could not connect to the database. Exiting now...MongoNetworkError: failed to connect to server [anon_ask_mongo:27017] on first connect [MongoError: Authentication failed.]
```


**Solution:**

This usually happens when Mongo init file is changed. You can run the `reset.sh` script inside the /Docker directory. 

---