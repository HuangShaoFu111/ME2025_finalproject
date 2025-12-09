import sqlite3
import os

DB_NAME = 'arcade.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """ 初始化資料庫 """
    conn = get_db_connection()
    c = conn.cursor()
    
    # 建立使用者資料表 (新增 avatar 欄位，預設為 default.png)
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT DEFAULT 'default.png'
        )
    ''')
    
    # 建立分數資料表 (設定 ON DELETE CASCADE 以便刪除帳號時一併刪除分數)
    c.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()
    print("資料庫初始化完成！")

def create_user(username, password):
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', 
                     (username, password))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def verify_user(username, password):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?', 
                        (username, password)).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """ 透過 ID 取得使用者完整資料 (含頭貼) """
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user

def update_username(user_id, new_username):
    """ 更新使用者名稱 """
    conn = get_db_connection()
    try:
        conn.execute('UPDATE users SET username = ? WHERE id = ?', (new_username, user_id))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False # 名稱重複
    finally:
        conn.close()

def update_avatar(user_id, filename):
    """ 更新頭貼檔名 """
    conn = get_db_connection()
    conn.execute('UPDATE users SET avatar = ? WHERE id = ?', (filename, user_id))
    conn.commit()
    conn.close()

def delete_user(user_id):
    """ 刪除使用者及其所有分數紀錄 """
    conn = get_db_connection()
    # 開啟外鍵約束支援
    conn.execute("PRAGMA foreign_keys = ON") 
    conn.execute('DELETE FROM users WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()

def insert_score(user_id, game_name, score):
    conn = get_db_connection()
    conn.execute('INSERT INTO scores (user_id, game_name, score) VALUES (?, ?, ?)', 
                 (user_id, game_name, score))
    conn.commit()
    conn.close()

def get_leaderboard(game_name):
    conn = get_db_connection()
    query = '''
        SELECT u.username, u.avatar, s.score, s.timestamp 
        FROM scores s
        JOIN users u ON s.user_id = u.id
        WHERE s.game_name = ?
        ORDER BY s.score DESC
        LIMIT 10
    '''
    scores = conn.execute(query, (game_name,)).fetchall()
    conn.close()
    return [dict(row) for row in scores]


def get_user_scores_by_game(user_id, game_name):
    """ 獲取特定使用者在某遊戲中的最高分數紀錄 (用於排行榜頁面) """
    conn = get_db_connection()
    query = '''
        SELECT score, timestamp 
        FROM scores 
        WHERE user_id = ? AND game_name = ? 
        ORDER BY score DESC, timestamp DESC
        LIMIT 1 
    '''
    scores = conn.execute(query, (user_id, game_name)).fetchall()
    conn.close()
    return [dict(score) for score in scores]

def get_all_best_scores_by_user(user_id):
    """ 獲取特定使用者在所有遊戲中的最高分數 (Lobby 專用) """
    conn = get_db_connection()
    query = '''
        SELECT game_name, score, timestamp 
        FROM scores s
        WHERE s.user_id = ?
        AND s.score = (
            SELECT MAX(score) 
            FROM scores 
            WHERE user_id = s.user_id AND game_name = s.game_name
        )
        GROUP BY game_name
        ORDER BY game_name
    '''
    scores = conn.execute(query, (user_id,)).fetchall()
    conn.close()
    # 將結果轉換為以 game_name 為鍵的字典
    return {row['game_name']: dict(row) for row in scores}

if __name__ == '__main__':
    init_db()