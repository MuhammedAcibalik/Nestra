"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
class UserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
            include: { role: true }
        });
    }
    async create(data) {
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: {
                    connect: { name: 'OPERATOR' }
                }
            },
            include: { role: true }
        });
    }
    async update(id, data) {
        return this.prisma.user.update({
            where: { id },
            data
        });
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map