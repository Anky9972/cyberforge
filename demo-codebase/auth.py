def login(username, password):
    query = f"SELECT * FROM users WHERE username='{username}'"
    return db.execute(query)
