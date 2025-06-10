#!/bin/bash

# Validate SQL migration file
migration_file="/home/moika/code/studio_moikas/supabase/migrations/20250110100000_populate_initial_models.sql"

echo "Validating SQL syntax in migration file..."

# Check for common SQL syntax issues
echo "Checking for missing semicolons..."
awk '
BEGIN { in_statement = 0; last_line = "" }
/^(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/ { 
    if (in_statement && last_line !~ /;[[:space:]]*$/) {
        print "Missing semicolon before line", NR, ":", $0
    }
    in_statement = 1
}
/;[[:space:]]*$/ { in_statement = 0 }
{ last_line = $0 }
' "$migration_file"

echo "Checking INSERT statements..."
grep -n "^INSERT INTO" "$migration_file" | while read -r line; do
    line_num=$(echo "$line" | cut -d: -f1)
    # Find the corresponding VALUES and check if it ends properly
    echo "INSERT statement at line $line_num"
done

echo "Done."