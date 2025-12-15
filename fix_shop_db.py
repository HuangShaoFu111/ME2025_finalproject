import sqlite3

def init_shop_db():
    db_path = 'arcade.db'
    print(f"正在升級資料庫以支援商店系統: {db_path} ...")
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    try:
        # 1. 在 users 表新增 'spent_points' (已花費點數)
        try:
            c.execute("ALTER TABLE users ADD COLUMN spent_points INTEGER DEFAULT 0")
            print("✅ 新增欄位 'spent_points'。")
        except sqlite3.OperationalError:
            print("ℹ️ 欄位 'spent_points' 已存在，跳過。")

        # 2. 在 users 表新增 'equipped_title' (目前裝備稱號)
        try:
            c.execute("ALTER TABLE users ADD COLUMN equipped_title TEXT DEFAULT ''")
            print("✅ 新增欄位 'equipped_title'。")
        except sqlite3.OperationalError:
            print("ℹ️ 欄位 'equipped_title' 已存在，跳過。")
        
        # 1. 新增 is_suspect 欄位
        try:
            c.execute("ALTER TABLE users ADD COLUMN is_suspect INTEGER DEFAULT 0;")
            print("✅ 成功新增欄位：is_suspect")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️  欄位 is_suspect 已存在，跳過。")
            else:
                print(f"❌ 新增 is_suspect 失敗：{e}")

        # 2. 新增 warning_pending 欄位
        try:
            c.execute("ALTER TABLE users ADD COLUMN warning_pending INTEGER DEFAULT 0;")
            print("✅ 成功新增欄位：warning_pending")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️  欄位 warning_pending 已存在，跳過。")
            else:
                print(f"❌ 新增 warning_pending 失敗：{e}")

        conn.commit()
        print("💾 變更已儲存。")

        # 3. 建立 user_items 表 (紀錄玩家擁有的物品)
        c.execute('''
            CREATE TABLE IF NOT EXISTS user_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_id TEXT NOT NULL,
                item_type TEXT NOT NULL,
                acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("✅ 建立資料表 'user_items'。")

        conn.commit()
        print("🎉 資料庫升級完成！")
        
    except Exception as e:
        print(f"❌ 發生錯誤: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    init_shop_db()