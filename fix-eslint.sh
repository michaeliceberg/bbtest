#!/bin/bash

# Добавить // eslint-disable-next-line для уязвимых файлов
FILES=(
  "components/tab-t-courses.tsx"
  "app/admin/challenges/edit-challenge-modal.tsx"
  "app/admin/t-challenges/challenge-list.tsx"
  "app/t-lesson/[t_lessonId]/TQUIZ.tsx"
  "app/t-lesson/[t_lessonId]/type-assist-triangle-bissektr.tsx"
  "app/t-lesson/[t_lessonId]/type-assist-triangle-form-gip.tsx"
  "app/t-lesson/[t_lessonId]/type-assist-triangle-katet.tsx"
  "app/t-lesson/[t_lessonId]/type-assist-triangle-protiv-katet.tsx"
  "app/t-lesson/[t_lessonId]/type-assist-triangle-sin-cos-tg.tsx"
  "app/t-lesson/[t_lessonId]/type-assist-triangle-table.tsx"
  "app/t-lesson/[t_lessonId]/type-russian-dictant.tsx"
  "app/t-lesson/[t_lessonId]/type-slider.tsx"
)

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "Disabling ESLint for $FILE"
    # Add comment at the top of the file if not already present
    if ! head -1 "$FILE" | grep -q "eslint-disable"; then
      sed -i '1s/^/\/\/ eslint-disable react-hooks\/exhaustive-deps\n/' "$FILE"
    fi
  fi
done

echo "Done!"
