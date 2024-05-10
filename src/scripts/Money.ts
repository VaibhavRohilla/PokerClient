

export class Money
{
    private _valueInCents : number;
    
    get value() : number
    {
        return this._valueInCents / 100;
    }
    
    constructor(value : number)
    {
        this._valueInCents = Math.trunc(value * 100);
    }

    get valueInCents() : number
    {
        return this._valueInCents;
    }

    add(money : Money)
    {
        this._valueInCents += money.valueInCents;
    } 

    subtract(money : Money)
    {
        this._valueInCents -= money.valueInCents;
    }

    multiply(multiplier : number)
    {
        if(multiplier < 0)
            throw new Error("Multiplier cannot be negative");

        this._valueInCents *= multiplier;
    }

    static Add(money1 : Money, money2 : Money) : Money
    {
        const newMoney = new Money(0);
        newMoney.add(money1);
        newMoney.add(money2);

        return newMoney;
    }

    static Subtract(money1 : Money, money2 : Money) : Money
    {
        const newMoney = new Money(0);
        newMoney.add(money1);
        newMoney.subtract(money2);

        return newMoney;
    }

    static Multiply(money : Money, multiplier : number) : Money
    {
        const newMoney = new Money(0);

        newMoney.add(money);
        newMoney.multiply(multiplier);

        return newMoney;
    }


    isEqualTo(money : Money) : boolean
    {
        return this._valueInCents == money.valueInCents;
    }

    isGte(money : Money) : boolean
    {
        return this._valueInCents >= money.valueInCents;
    }

    isLte(money : Money) : boolean
    {
        return this._valueInCents <= money.valueInCents;
    }

    isGt(money : Money) : boolean
    {
        return this._valueInCents > money.valueInCents;
    }

    isLt(money : Money) : boolean
    {
        return this._valueInCents < money.valueInCents;
    }

    copy() : Money
    {
        return new Money(this.value);
    } 

    divideIntoPart(partCount : number) : Money
    {
        if(partCount < 1)
            throw new Error("Part count cannot be less than 1");

        return new Money(this.value / partCount);
    }


}