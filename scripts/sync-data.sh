# 数据同步脚本
# 用法: ./sync-data.sh [导出|导入]

#!/bin/bash

LOCAL_DB="mysql://root:123456@localhost:3306/ai_tools"
REMOTE_HOST="你的服务器IP"
REMOTE_USER="root"
REMOTE_DB="ai_tools_platform"
REMOTE_DB_USER="ai_tools_user"

# 需要同步的表（按依赖顺序）
TABLES=(
  "Category"
  "SubCategory"
  "UseCase"
  "Tool"
  "Course"
  "News"
  "Review"
  "SiteSetting"
)

case "$1" in
  export)
    echo "📤 正在导出本地数据..."
    "D:/DTServer/mysql/5.7.26/bin/mysqldump" -u root -p123456 ai_tools ${TABLES[@]} > data_export.sql
    echo "✅ 导出完成: data_export.sql"
    ;;

  import)
    echo "📥 正在导入到线上数据库..."
    echo "请手动将 data_export.sql 上传到服务器后执行:"
    echo "mysql -u ${REMOTE_DB_USER} -p ${REMOTE_DB} < data_export.sql"
    ;;

  sync)
    echo "🔄 开始同步流程..."
    $0 export
    echo ""
    echo "📤 请将 data_export.sql 上传到服务器并执行:"
    echo "scp data_export.sql root@${REMOTE_HOST}:/tmp/"
    echo "ssh root@${REMOTE_HOST} 'mysql -u ${REMOTE_DB_USER} -p ${REMOTE_DB} < /tmp/data_export.sql'"
    ;;

  *)
    echo "用法: $0 [export|import|sync]"
    echo "  export - 导出本地数据到 SQL 文件"
    echo "  import - 显示导入命令"
    echo "  sync   - 导出并显示完整同步命令"
    ;;
esac
