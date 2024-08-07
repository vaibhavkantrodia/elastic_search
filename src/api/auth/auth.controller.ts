import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.authService.createNewUser(createUserDto);
  }

  @Get(':email')
  async getUserByEmail(@Param('email') email: string) {
    return await this.authService.getUserByEmail(email);
  }

  @Get('/search/:name')
  async getUserByName(@Param('name') name: string) {
    return await this.authService.searchUserByName(name);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.authService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async removeUser(@Param('id') id: string) {
    return await this.authService.deleteUser(id);
  }
}
