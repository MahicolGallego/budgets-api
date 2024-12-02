import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from 'src/categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class CategorySeeder {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async run() {
    // Datos de ejemplo para las categorías
    const categories = [
      { name: 'Food', user_id: null },
      { name: 'Entertainment', user_id: null },
      { name: 'Transport', user_id: null },
    ];

    // Inserta las categorías si no existen
    for (const category of categories) {
      const exists = await this.categoryRepository.findOne({
        where: { name: category.name, user_id: category.user_id },
      });

      if (!exists) {
        await this.categoryRepository.save(category);
        console.log(`Inserted category: ${category.name}`);
      }
    }
  }
}