import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../user/schema/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ErrorHandlerService } from 'src/utils/error-handler.service';
import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from '../user/dto/update-user.dto';

let client: Client;
@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private configService: ConfigService,
        private errorHandlerService: ErrorHandlerService
    ) {
        client = new Client({
            node: this.configService.get<string>('ELASTIC_URL'),
            auth: {
                apiKey: this.configService.get<string>('ELASTIC_API_KEY'),
            }
        });
    }

    async createNewUser(createUserDto: CreateUserDto) {
        try {
            const user = await this.userModel.create({
                name: createUserDto.name,
                email: createUserDto.email,
                password: await bcrypt.hash(createUserDto.password, 10),
            });

            const indexExists = await client.indices.exists({
                index: 'user',
            });
            if (!indexExists) {
                await client.indices.create({
                    index: 'user',
                });
            }

            await client.index({
                index: 'user',
                id: user._id.toString(),
                body: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    password: user.password
                }
            });
            user.password = undefined;
            return {
                message: 'User created successfully',
                data: user
            }
        } catch (error) {
            await this.errorHandlerService.HttpException(error);
        }
    }

    async getUserByEmail(email: string) {
        try {
            const user = await client.search({
                index: 'user',
                body: {
                    query: {
                        match: {
                            email: email
                        }
                    }
                }
            });
            return user.hits.hits;
        } catch (error) {
            await this.errorHandlerService.HttpException(error);
        }
    }

    // search by name 
    async searchUserByName(name: string) {
        try {
            const user = await client.search({
                index: 'user',
                body: {
                    query: {
                        regexp: {
                            name: {
                                value: `.*${name.toLowerCase()}.*`
                            }
                        }
                    }
                }
            });
            return {
                statusCode: 200,
                message: 'User found successfully',
                data: user.hits.hits
            };
        } catch (error) {
            await this.errorHandlerService.HttpException(error);
        }
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto) {
        try {
            const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
            await client.update({
                index: 'user',
                id: id,
                body: {
                    doc: {
                        name: user.name,
                    }
                }
            });

            return {
                statusCode: 200,
                message: 'User updated successfully',
            }
        } catch (error) {
            await this.errorHandlerService.HttpException(error);
        }
    }

    async deleteUser(id: string) {
        try {
            const user = await this.userModel.findByIdAndDelete(id);
            await client.delete({
                index: 'user',
                id: id
            });
            return {
                statusCode: 200,
                message: 'User deleted successfully',
            }
        } catch (error) {
            await this.errorHandlerService.HttpException(error);
        }
    }
}
