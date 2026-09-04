import re, glob

for path in sorted(glob.glob('GNT_GITHUB_REPOSITORY/backend/src/modules/m11-payment/services/*.service.ts')):
    with open(path) as f:
        s = f.read()
    orig = s
    s = s.replace(
        "private notFound(message: string): ApiError {\n    return { code: 'NOT_FOUND', message };\n  }",
        "private notFound(message: string): AppError {\n    return new AppError('NOT_FOUND', message, 404);\n  }")
    s = s.replace(
        "private badRequest(message: string): ApiError {\n    return { code: 'BAD_REQUEST', message };\n  }",
        "private badRequest(message: string): AppError {\n    return new AppError('BAD_REQUEST', message, 400);\n  }")
    s = re.sub(r",\s*ApiError\s*\} from '\.\./types'", " } from '../types'", s)
    s = s.replace("  ApiError,\n", "")
    if "error-classes" not in s:
        first_import = s.index("import ")
        line_end = s.index("\n", first_import)
        s = s[:line_end+1] + "import { AppError } from '@/common/errors/error-classes';\n" + s[line_end+1:]
    if s != orig:
        with open(path, 'w') as f:
            f.write(s)
        print("UPDATED", path)
    else:
        print("no-change", path)
