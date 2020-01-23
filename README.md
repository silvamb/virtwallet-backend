# Virtwallet

This is a personal project to build a serverless application to control and share household budget and expenses.

There are many apps for personal budget, but I've found none that have ALL the requirements I was looking for:
* Process Bank Statements or is integrated with a bank account
* Share the budget with others
* Allow to define a custom period to consider the expenses, for example, 25th to 24th
* Allow to estimate the amount of money left in the end of a period, counting future expenses.
* Desktop version
* FREE or with a good value for money

## Disclaimer
This app is a Work In Progress. I'm trying to work a little bit every day. I'm using this project to study new technologies and build something useful.

## Prerequisites

- [Serverless Framework v1.0+](https://serverless.com/)
- [Nodejs v10.0+](https://nodejs.org/)
- [Setup your AWS credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/)

##Installation

Clone the project from GitHub:
```
git clone https://github.com/silvamb/virtwallet-serverless.git
```

Enter the newly created folder:
```
cd virtwallet-serverless
```

Deploy your functions and endpoints:
```
serverless deploy
```
